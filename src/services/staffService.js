import {
  addDoc,
  collection,
  deleteDoc,
  getDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { db } from './firebase'

const staffCollection = collection(db, 'trabajadores')

const normalizeValue = (value) => String(value ?? '').trim()

const normalizeStaff = (staffMember) => ({
  nombre: normalizeValue(staffMember?.nombre),
  especialidad: normalizeValue(staffMember?.especialidad),
  activo: Boolean(staffMember?.activo),
  negocioId: normalizeValue(staffMember?.negocioId)
})

const ensureStaffName = (name) => {
  if (!normalizeValue(name)) {
    const error = new Error('staff_name_required')
    error.code = 'staff_name_required'
    throw error
  }
}

const ensureBusinessId = (businessId) => {
  if (!normalizeValue(businessId)) {
    const error = new Error('business_id_required')
    error.code = 'business_id_required'
    throw error
  }
}

const existsDuplicateStaff = async ({ negocioId, nombre, especialidad, excludedId = '' }) => {
  const byBusinessQuery = query(staffCollection, where('negocioId', '==', negocioId))
  const snapshot = await getDocs(byBusinessQuery)

  const normalizedName = normalizeValue(nombre).toLowerCase()
  const normalizedSpecialty = normalizeValue(especialidad).toLowerCase()

  return snapshot.docs.some((staffDoc) => {
    if (staffDoc.id === excludedId) return false

    const data = staffDoc.data()
    const sameName = normalizeValue(data?.nombre).toLowerCase() === normalizedName
    const sameSpecialty = normalizeValue(data?.especialidad).toLowerCase() === normalizedSpecialty

    return sameName && sameSpecialty
  })
}

export const createStaffMember = async ({ nombre, especialidad = '', activo = true, negocioId }) => {
  const normalizedBusinessId = normalizeValue(negocioId)
  const normalizedName = normalizeValue(nombre)
  const normalizedSpecialty = normalizeValue(especialidad)

  ensureBusinessId(normalizedBusinessId)
  ensureStaffName(normalizedName)

  const duplicated = await existsDuplicateStaff({
    negocioId: normalizedBusinessId,
    nombre: normalizedName,
    especialidad: normalizedSpecialty
  })

  if (duplicated) {
    const error = new Error('duplicate_staff')
    error.code = 'duplicate_staff'
    throw error
  }

  const payload = {
    nombre: normalizedName,
    especialidad: normalizedSpecialty,
    activo: Boolean(activo),
    negocioId: normalizedBusinessId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  const docRef = await addDoc(staffCollection, payload)
  return docRef.id
}

export const updateStaffMember = async (staffId, data) => {
  const normalizedStaffId = normalizeValue(staffId)

  if (!normalizedStaffId) {
    const error = new Error('staff_id_required')
    error.code = 'staff_id_required'
    throw error
  }

  const currentSnapshot = await getDoc(doc(db, 'trabajadores', normalizedStaffId))

  if (!currentSnapshot.exists()) {
    const error = new Error('staff_not_found')
    error.code = 'staff_not_found'
    throw error
  }

  const currentData = normalizeStaff(currentSnapshot.data())

  const nextName = Object.prototype.hasOwnProperty.call(data, 'nombre')
    ? normalizeValue(data.nombre)
    : currentData.nombre
  const nextSpecialty = Object.prototype.hasOwnProperty.call(data, 'especialidad')
    ? normalizeValue(data.especialidad)
    : currentData.especialidad

  ensureStaffName(nextName)

  const businessId = normalizeValue(data?.negocioId || currentData.negocioId)

  if (businessId) {
    const duplicated = await existsDuplicateStaff({
      negocioId: businessId,
      nombre: nextName,
      especialidad: nextSpecialty,
      excludedId: normalizedStaffId
    })

    if (duplicated) {
      const error = new Error('duplicate_staff')
      error.code = 'duplicate_staff'
      throw error
    }
  }

  const payload = {
    ...data,
    updatedAt: serverTimestamp()
  }

  payload.nombre = nextName
  payload.especialidad = nextSpecialty

  await updateDoc(doc(db, 'trabajadores', normalizedStaffId), payload)
}

export const deleteStaffMember = async (staffId) => {
  const normalizedStaffId = normalizeValue(staffId)

  if (!normalizedStaffId) {
    const error = new Error('staff_id_required')
    error.code = 'staff_id_required'
    throw error
  }

  await deleteDoc(doc(db, 'trabajadores', normalizedStaffId))
}

export const subscribeStaffByBusiness = (
  businessId,
  onData,
  onError,
  { onlyActive = false } = {}
) => {
  const normalizedBusinessId = normalizeValue(businessId)

  if (!normalizedBusinessId) {
    onData([])
    return () => {}
  }

  const staffByBusinessQuery = query(staffCollection, where('negocioId', '==', normalizedBusinessId))

  return onSnapshot(
    staffByBusinessQuery,
    (snapshot) => {
      let staffList = snapshot.docs.map((staffDoc) => {
        const normalized = normalizeStaff(staffDoc.data())

        return {
          id: staffDoc.id,
          ...normalized
        }
      })

      if (onlyActive) {
        staffList = staffList.filter((staffMember) => staffMember.activo)
      }

      staffList = staffList.sort((a, b) => {
        if (a.activo !== b.activo) return a.activo ? -1 : 1
        return String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' })
      })

      onData(staffList)
    },
    (error) => {
      console.error(error)
      onError?.(error)
    }
  )
}

export const getActiveStaffByBusiness = async (businessId) => {
  const normalizedBusinessId = normalizeValue(businessId)

  if (!normalizedBusinessId) return []

  const byBusinessQuery = query(staffCollection, where('negocioId', '==', normalizedBusinessId))
  const snapshot = await getDocs(byBusinessQuery)

  return snapshot.docs
    .map((staffDoc) => {
      const normalized = normalizeStaff(staffDoc.data())
      return {
        id: staffDoc.id,
        ...normalized
      }
    })
    .filter((staffMember) => staffMember.activo)
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' }))
}
