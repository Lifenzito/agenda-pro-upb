import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  updateDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { normalizeFullPhone } from '../utils/phoneUtils'

const appointmentsCollection = collection(db, 'citas')
const FIRESTORE_TIMEOUT_MS = 12000

const SLOT_TAKEN_ERROR = 'slot_taken'

const withTimeout = (promise, timeoutMs = FIRESTORE_TIMEOUT_MS) => {
  let timeoutId

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('timeout_guardado_cita'))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId)
  })
}

export const saveAppointment = async (appointmentData) => {
  const workerId = String(appointmentData.trabajadorId ?? '').trim()
  const workerName = String(appointmentData.trabajadorNombre ?? '').trim()

  const payload = {
    ...appointmentData,
    telefono: normalizeFullPhone(appointmentData.telefono),
    trabajadorId: workerId,
    trabajadorNombre: workerName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  if (appointmentData.email) {
    payload.email = String(appointmentData.email).trim().toLowerCase()
  }

  try {
    const docRef = await withTimeout(addDoc(appointmentsCollection, payload))
    return docRef.id
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const createAppointment = async (appointmentData) => {
  try {
    const hasConflict = await isSlotOccupied(
      appointmentData.fecha,
      appointmentData.hora,
      '',
      appointmentData.negocioId
    )

    if (hasConflict) {
      const slotError = new Error(SLOT_TAKEN_ERROR)
      slotError.code = SLOT_TAKEN_ERROR
      throw slotError
    }

    return await saveAppointment(appointmentData)
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getAppointments = (onData, onError) => {
  const appointmentsQuery = query(appointmentsCollection, orderBy('fecha', 'asc'))

  return onSnapshot(
    appointmentsQuery,
    (snapshot) => {
      const appointments = snapshot.docs
        .map((appointmentDoc) => ({
          id: appointmentDoc.id,
          ...appointmentDoc.data()
        }))
        .sort((a, b) => {
          const first = `${a.fecha ?? ''} ${a.hora ?? ''}`
          const second = `${b.fecha ?? ''} ${b.hora ?? ''}`
          return first.localeCompare(second)
        })

      onData(appointments)
    },
    (error) => {
      console.error(error)
      onError?.(error)
    }
  )
}

export const updateAppointment = async (id, appointmentData) => {
  const appointmentRef = doc(db, 'citas', id)

  const payload = {
    ...appointmentData,
    updatedAt: serverTimestamp()
  }

  if (Object.prototype.hasOwnProperty.call(appointmentData, 'telefono')) {
    payload.telefono = normalizeFullPhone(appointmentData.telefono)
  }

  if (Object.prototype.hasOwnProperty.call(appointmentData, 'email')) {
    payload.email = String(appointmentData.email ?? '').trim().toLowerCase()
  }

  if (Object.prototype.hasOwnProperty.call(appointmentData, 'trabajadorId')) {
    payload.trabajadorId = String(appointmentData.trabajadorId ?? '').trim()
  }

  if (Object.prototype.hasOwnProperty.call(appointmentData, 'trabajadorNombre')) {
    payload.trabajadorNombre = String(appointmentData.trabajadorNombre ?? '').trim()
  }

  try {
    if (payload.fecha && payload.hora) {
      const hasConflict = await isSlotOccupied(payload.fecha, payload.hora, id, payload.negocioId)

      if (hasConflict) {
        const slotError = new Error(SLOT_TAKEN_ERROR)
        slotError.code = SLOT_TAKEN_ERROR
        throw slotError
      }
    }

    await withTimeout(updateDoc(appointmentRef, payload))
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const deleteAppointment = async (id) => {
  const appointmentRef = doc(db, 'citas', id)

  try {
    await withTimeout(deleteDoc(appointmentRef))
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getAppointmentsByPhone = async (telefono) => {
  const normalizedPhone = normalizeFullPhone(telefono)

  if (!normalizedPhone) {
    return []
  }

  const appointmentsByPhoneQuery = query(
    appointmentsCollection,
    where('telefono', '==', normalizedPhone)
  )

  try {
    const snapshot = await withTimeout(getDocs(appointmentsByPhoneQuery))

    return snapshot.docs
      .map((appointmentDoc) => ({
        id: appointmentDoc.id,
        ...appointmentDoc.data()
      }))
      .sort((a, b) => {
        const first = `${a.fecha ?? ''} ${a.hora ?? ''}`
        const second = `${b.fecha ?? ''} ${b.hora ?? ''}`
        return first.localeCompare(second)
      })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getAppointmentsByUser = async (user) => {
  const userId = String(user?.uid ?? '').trim()
  const userEmail = String(user?.email ?? '').trim().toLowerCase()

  if (!userId && !userEmail) {
    return []
  }

  const queries = []

  if (userId) {
    queries.push(query(appointmentsCollection, where('userId', '==', userId)))
  }

  if (userEmail) {
    queries.push(query(appointmentsCollection, where('email', '==', userEmail)))
  }

  try {
    const snapshots = await Promise.all(queries.map((item) => withTimeout(getDocs(item))))
    const mapById = new Map()

    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((appointmentDoc) => {
        mapById.set(appointmentDoc.id, {
          id: appointmentDoc.id,
          ...appointmentDoc.data()
        })
      })
    })

    return [...mapById.values()].sort((a, b) => {
      const first = `${a.fecha ?? ''} ${a.hora ?? ''}`
      const second = `${b.fecha ?? ''} ${b.hora ?? ''}`
      return first.localeCompare(second)
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getOccupiedHoursByDate = async (
  fecha,
  excludedAppointmentId = '',
  businessId = ''
) => {
  if (!fecha) return []

  const slotsByDateQuery = businessId
    ? query(appointmentsCollection, where('negocioId', '==', String(businessId)))
    : query(appointmentsCollection, where('fecha', '==', fecha))

  try {
    const snapshot = await withTimeout(getDocs(slotsByDateQuery))

    return snapshot.docs
      .filter((appointmentDoc) => appointmentDoc.id !== excludedAppointmentId)
      .filter((appointmentDoc) => appointmentDoc.data()?.fecha === fecha)
      .map((appointmentDoc) => appointmentDoc.data()?.hora)
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)))
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const isSlotOccupied = async (
  fecha,
  hora,
  excludedAppointmentId = '',
  businessId = ''
) => {
  const slotsByDateQuery = businessId
    ? query(appointmentsCollection, where('negocioId', '==', String(businessId)))
    : query(appointmentsCollection, where('fecha', '==', fecha))

  try {
    const snapshot = await withTimeout(getDocs(slotsByDateQuery))

    return snapshot.docs.some((appointmentDoc) => {
      const data = appointmentDoc.data()
      const sameDate = data.fecha === fecha
      const sameHour = data.hora === hora
      const sameAppointment = appointmentDoc.id === excludedAppointmentId
      return sameDate && sameHour && !sameAppointment
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getAppointmentsByBusiness = (businessId, onData, onError) => {
  if (!businessId) {
    onData([])
    return () => {}
  }

  const appointmentsByBusinessQuery = query(
    appointmentsCollection,
    where('negocioId', '==', String(businessId))
  )

  return onSnapshot(
    appointmentsByBusinessQuery,
    (snapshot) => {
      const appointments = snapshot.docs
        .map((appointmentDoc) => ({
          id: appointmentDoc.id,
          ...appointmentDoc.data()
        }))
        .sort((a, b) => {
          const first = `${a.fecha ?? ''} ${a.hora ?? ''}`
          const second = `${b.fecha ?? ''} ${b.hora ?? ''}`
          return first.localeCompare(second)
        })

      onData(appointments)
    },
    (error) => {
      console.error(error)
      onError?.(error)
    }
  )
}

export { SLOT_TAKEN_ERROR }
