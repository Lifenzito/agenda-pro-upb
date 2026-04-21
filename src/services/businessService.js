import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { db } from './firebase'

const businessesCollection = collection(db, 'negocios')

export const createBusiness = async ({ nombre, ownerId, ownerEmail }) => {
  const payload = {
    nombre: String(nombre ?? '').trim(),
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

export const getBusinessById = async (businessId) => {
  if (!businessId) return null

  try {
    const snapshot = await getDoc(doc(db, 'negocios', businessId))

    if (!snapshot.exists()) return null

    return {
      id: snapshot.id,
      ...snapshot.data()
    }
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
    return {
      id: first.id,
      ...first.data()
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const updateBusiness = async (businessId, data) => {
  if (!businessId) throw new Error('business_id_required')

  try {
    await updateDoc(doc(db, 'negocios', businessId), {
      ...data,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}
