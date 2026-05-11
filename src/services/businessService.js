import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { db } from './firebase'
import { slugify } from '../utils/slugify'

const businessesCollection = collection(db, 'negocios')

export const generateUniqueSlug = async (name, { ignoreBusinessId = '' } = {}) => {
  const base = slugify(name)

  if (!base) return ''

  let candidate = base
  let suffix = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const slugQuery = query(businessesCollection, where('slug', '==', candidate), limit(2))
    const snapshot = await getDocs(slugQuery)

    const collision = snapshot.docs.find((docSnap) => docSnap.id !== ignoreBusinessId)

    if (!collision) return candidate

    suffix += 1
    candidate = `${base}-${suffix}`
  }
}

export const createBusiness = async ({ nombre, ownerId, ownerEmail }) => {
  const cleanName = String(nombre ?? '').trim()
  const slug = await generateUniqueSlug(cleanName)

  const payload = {
    nombre: cleanName,
    slug,
    ownerId,
    ownerEmail: String(ownerEmail ?? '').trim().toLowerCase(),
    horarioInicio: '08:00',
    horarioFin: '18:00',
    servicios: ['Corte de cabello', 'Tinte'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  try {
    const businessRef = await addDoc(businessesCollection, payload)
    return businessRef.id
  } catch (error) {
    console.error(error)
    throw error
  }
}

// Backfill transparente: si el negocio no tiene slug guardado, lo genera y
// lo persiste en Firestore para que /negocio/:slug funcione sin requerir
// que el owner edite manualmente nada.
const ensureBusinessSlug = async (business) => {
  if (!business?.id) return business

  const currentSlug = String(business.slug ?? '').trim()
  if (currentSlug) return business

  const candidateName = String(business.nombre ?? '').trim()
  if (!candidateName) return business

  try {
    const generated = await generateUniqueSlug(candidateName, {
      ignoreBusinessId: business.id
    })

    if (!generated) return business

    await updateDoc(doc(db, 'negocios', business.id), {
      slug: generated,
      updatedAt: serverTimestamp()
    })

    return { ...business, slug: generated }
  } catch (error) {
    // El backfill nunca debe romper la carga del negocio: si falla la
    // escritura (reglas, red, etc.), devolvemos el negocio sin slug y
    // dejamos que la siguiente lectura lo vuelva a intentar.
    console.error('No se pudo backfillear el slug del negocio:', error)
    return business
  }
}

export const getBusinessById = async (businessId) => {
  if (!businessId) return null

  try {
    const snapshot = await getDoc(doc(db, 'negocios', businessId))

    if (!snapshot.exists()) return null

    const business = {
      id: snapshot.id,
      ...snapshot.data()
    }

    return await ensureBusinessSlug(business)
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getBusinessBySlug = async (slug) => {
  const normalizedSlug = String(slug ?? '').trim().toLowerCase()

  if (!normalizedSlug) return null

  try {
    const slugQuery = query(
      businessesCollection,
      where('slug', '==', normalizedSlug),
      limit(1)
    )
    const snapshot = await getDocs(slugQuery)

    if (!snapshot.empty) {
      const first = snapshot.docs[0]
      return {
        id: first.id,
        ...first.data()
      }
    }

    // Fallback: si no existe el slug, intentar buscar por id directo
    // (compatibilidad para negocios viejos sin slug guardado).
    const byId = await getBusinessById(normalizedSlug)
    return byId
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getBusinesses = async () => {
  try {
    const snapshot = await getDocs(businessesCollection)

    return snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data()
      }))
      .sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? '')))
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getBusinessByOwnerId = async (ownerId) => {
  if (!ownerId) return null

  try {
    const businessQuery = query(businessesCollection, where('ownerId', '==', ownerId))
    const snapshot = await getDocs(businessQuery)

    if (!snapshot.docs.length) return null

    const first = snapshot.docs[0]
    const business = {
      id: first.id,
      ...first.data()
    }

    return await ensureBusinessSlug(business)
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const updateBusiness = async (businessId, data) => {
  if (!businessId) throw new Error('business_id_required')

  try {
    const payload = {
      ...data,
      updatedAt: serverTimestamp()
    }

    // Backfill: si el negocio se está actualizando y todavía no tiene slug,
    // generarlo a partir del nombre actual o del nombre del payload.
    const hasSlugInPayload = Object.prototype.hasOwnProperty.call(data, 'slug')

    if (!hasSlugInPayload) {
      const existing = await getBusinessById(businessId)
      const currentSlug = String(existing?.slug ?? '').trim()

      if (!currentSlug) {
        const candidateName = String(data?.nombre ?? existing?.nombre ?? '').trim()
        const generated = await generateUniqueSlug(candidateName, {
          ignoreBusinessId: businessId
        })

        if (generated) {
          payload.slug = generated
        }
      }
    }

    await updateDoc(doc(db, 'negocios', businessId), payload)
    return payload.slug
  } catch (error) {
    console.error(error)
    throw error
  }
}
