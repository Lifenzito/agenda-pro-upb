import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { createBusiness } from './businessService'
import { ROLE_CLIENTE, ROLE_OWNER } from '../utils/roleHelpers'

const rollbackRegistration = async (firebaseUser, userDocRef, negocioId) => {
  if (negocioId) {
    try {
      await deleteDoc(doc(db, 'negocios', negocioId))
    } catch (e) {
      console.error('Rollback: no se pudo eliminar el negocio:', e)
    }
  }

  if (userDocRef) {
    try {
      await deleteDoc(userDocRef)
    } catch (e) {
      console.error('Rollback: no se pudo eliminar el perfil de usuario:', e)
    }
  }

  if (firebaseUser) {
    try {
      await deleteUser(firebaseUser)
    } catch (e) {
      console.error('Rollback: no se pudo revertir el Auth user:', e)
    }
  }
}

export const registerUser = async ({
  nombre,
  correo,
  password,
  accountType = ROLE_CLIENTE,
  businessName = ''
}) => {
  const normalizedEmail = String(correo).trim().toLowerCase()
  const normalizedAccountType = accountType === ROLE_OWNER ? ROLE_OWNER : ROLE_CLIENTE
  const cleanName = String(nombre ?? '').trim()
  const cleanBusinessName = String(businessName ?? '').trim()

  if (normalizedAccountType === ROLE_OWNER && !cleanBusinessName) {
    throw new Error('business_name_required')
  }

  const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
  const currentUser = userCredential.user
  const userDocRef = doc(db, 'usuarios', currentUser.uid)

  if (cleanName) {
    try {
      await updateProfile(currentUser, { displayName: cleanName })
    } catch (displayNameError) {
      console.error('No se pudo establecer el displayName del usuario:', displayNameError)
    }
  }

  try {
    await setDoc(
      userDocRef,
      {
        uid: currentUser.uid,
        nombre: cleanName,
        email: normalizedEmail,
        role: normalizedAccountType,
        negocioId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  } catch (profileError) {
    console.error('Error guardando el perfil en Firestore:', profileError)
    await rollbackRegistration(currentUser, null, null)
    throw profileError
  }

  if (normalizedAccountType !== ROLE_OWNER) {
    return currentUser
  }

  let negocioId
  try {
    negocioId = await createBusiness({
      nombre: cleanBusinessName,
      ownerId: currentUser.uid,
      ownerEmail: normalizedEmail
    })
  } catch (businessError) {
    console.error('Error creando el negocio del owner:', businessError)
    await rollbackRegistration(currentUser, userDocRef, null)
    throw businessError
  }

  try {
    await setDoc(
      userDocRef,
      {
        negocioId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  } catch (linkError) {
    console.error('Error enlazando el negocio al perfil del usuario:', linkError)
    await rollbackRegistration(currentUser, userDocRef, negocioId)
    throw linkError
  }

  return currentUser
}

export const loginUser = async ({ correo, password }) => {
  const normalizedEmail = String(correo).trim().toLowerCase()

  try {
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
    return userCredential.user
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const logoutUser = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const observeAuthState = (callback) => onAuthStateChanged(auth, callback)

export const getCurrentAuthUser = () => auth.currentUser

export const getUserProfile = async (uid) => {
  if (!uid) return null

  try {
    const snapshot = await getDoc(doc(db, 'usuarios', uid))
    return snapshot.exists() ? snapshot.data() : null
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getAuthErrorMessage = (error) => {
  const errorCode = error?.code ?? ''
  const rawMessage = String(error?.message ?? '').trim()

  if (rawMessage === 'business_name_required') {
    return 'Debes ingresar el nombre del negocio para completar el registro.'
  }

  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado.'
    case 'auth/invalid-email':
      return 'Ingresa un correo válido.'
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Correo o contraseña incorrectos.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta nuevamente más tarde.'
    case 'auth/operation-not-allowed':
      return 'El registro con email/contraseña no está habilitado. Actívalo en Firebase Console → Authentication → Sign-in method.'
    case 'auth/network-request-failed':
      return 'No hay conexión con Firebase. Verifica tu red o si un bloqueador está interfiriendo (error: auth/network-request-failed).'
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'La API key de Firebase no es válida. Revisa src/services/firebase.js.'
    case 'auth/admin-restricted-operation':
      return 'Firebase bloqueó la operación por restricciones de administrador (auth/admin-restricted-operation).'
    case 'auth/internal-error':
      return `Error interno de Firebase Auth (auth/internal-error). Detalle: ${rawMessage || 'sin detalle'}`
    case 'permission-denied':
      return 'Firestore rechazó la escritura (permission-denied). Revisa las reglas de seguridad para la colección "usuarios" / "negocios".'
    case 'unavailable':
      return 'Firestore no está disponible temporalmente (unavailable). Intenta de nuevo en unos segundos.'
    case 'resource-exhausted':
      return 'Se alcanzó el límite de uso de Firestore (resource-exhausted).'
    case 'failed-precondition':
      return 'Firestore rechazó la operación por una precondición fallida (failed-precondition).'
    case 'unauthenticated':
      return 'Firestore requiere autenticación válida (unauthenticated).'
    default:
      if (errorCode) {
        return `Error de Firebase: ${errorCode}${rawMessage ? ` — ${rawMessage}` : ''}`
      }
      if (rawMessage) {
        return `Error: ${rawMessage}`
      }
      return 'Ocurrió un error. Intenta nuevamente.'
  }
}
