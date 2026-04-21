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

const normalizeServiceList = (services) => {
  if (!Array.isArray(services)) return []

  const seen = new Set()
  const normalized = []

  services.forEach((service) => {
    const cleaned = normalizeValue(service)
    if (!cleaned) return
    const key = cleaned.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    normalized.push(cleaned)
  })

  return normalized
}

const normalizeStaff = (staffMember) => {
  const role = normalizeValue(staffMember?.rol) || normalizeValue(staffMember?.especialidad)

  return {
    nombre: normalizeValue(staffMember?.nombre),
    rol: role,
    especialidad: role,
    descripcion: normalizeValue(staffMember?.descripcion),
    serviciosAsignados: normalizeServiceList(staffMember?.serviciosAsignados),
    activo: staffMember?.activo !== false,
    negocioId: normalizeValue(staffMember?.negocioId)
  }
}

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

const existsDuplicateStaff = async ({ negocioId, nombre, rol, excludedId = '' }) => {
  const byBusinessQuery = query(staffCollection, where('negocioId', '==', negocioId))
  const snapshot = await getDocs(byBusinessQuery)

  const normalizedName = normalizeValue(nombre).toLowerCase()
  const normalizedRole = normalizeValue(rol).toLowerCase()

  return snapshot.docs.some((staffDoc) => {
    if (staffDoc.id === excludedId) return false

    const data = staffDoc.data()
    const sameName = normalizeValue(data?.nombre).toLowerCase() === normalizedName
    const existingRole = normalizeValue(data?.rol || data?.especialidad).toLowerCase()
    const sameRole = existingRole === normalizedRole

    return sameName && sameRole
  })
}

export const createStaffMember = async ({
  nombre,
  rol = '',
  especialidad = '',
  descripcion = '',
  serviciosAsignados = [],
  activo = true,
  negocioId
}) => {
  const normalizedBusinessId = normalizeValue(negocioId)
  const normalizedName = normalizeValue(nombre)
  const normalizedRole = normalizeValue(rol) || normalizeValue(especialidad)
  const normalizedDescription = normalizeValue(descripcion)
  const normalizedServices = normalizeServiceList(serviciosAsignados)

  ensureBusinessId(normalizedBusinessId)
  ensureStaffName(normalizedName)

  const duplicated = await existsDuplicateStaff({
    negocioId: normalizedBusinessId,
    nombre: normalizedName,
    rol: normalizedRole
  })

  if (duplicated) {
    const error = new Error('duplicate_staff')
    error.code = 'duplicate_staff'
    throw error
  }

  const payload = {
    nombre: normalizedName,
    rol: normalizedRole,
    especialidad: normalizedRole,
    descripcion: normalizedDescription,
    serviciosAsignados: normalizedServices,
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

  const hasRoleUpdate =
    Object.prototype.hasOwnProperty.call(data, 'rol') ||
    Object.prototype.hasOwnProperty.call(data, 'especialidad')

  const nextRole = hasRoleUpdate
    ? normalizeValue(data.rol ?? data.especialidad)
    : currentData.rol

  const hasDescriptionUpdate = Object.prototype.hasOwnProperty.call(data, 'descripcion')
  const nextDescription = hasDescriptionUpdate
    ? normalizeValue(data.descripcion)
    : currentData.descripcion

  const hasServicesUpdate = Object.prototype.hasOwnProperty.call(data, 'serviciosAsignados')
  const nextServices = hasServicesUpdate
    ? normalizeServiceList(data.serviciosAsignados)
    : currentData.serviciosAsignados

  ensureStaffName(nextName)

  const businessId = normalizeValue(data?.negocioId || currentData.negocioId)

  if (businessId && (hasRoleUpdate || Object.prototype.hasOwnProperty.call(data, 'nombre'))) {
    const duplicated = await existsDuplicateStaff({
      negocioId: businessId,
      nombre: nextName,
      rol: nextRole,
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
    nombre: nextName,
    rol: nextRole,
    especialidad: nextRole,
    descripcion: nextDescription,
    serviciosAsignados: nextServices,
    updatedAt: serverTimestamp()
  }

  if (Object.prototype.hasOwnProperty.call(data, 'activo')) {
    payload.activo = Boolean(data.activo)
  }

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

export const workerCanPerformService = (worker, serviceName) => {
  const normalizedService = normalizeValue(serviceName).toLowerCase()

  if (!normalizedService) return true

  const services = Array.isArray(worker?.serviciosAsignados)
    ? worker.serviciosAsignados
    : []

  if (!services.length) return true

  return services.some(
    (service) => normalizeValue(service).toLowerCase() === normalizedService
  )
}
