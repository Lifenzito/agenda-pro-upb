import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { createBusiness } from './businessService'
import { ROLE_CLIENTE, ROLE_OWNER } from '../utils/roleHelpers'

export const registerUser = async ({
  nombre,
  correo,
  password,
  accountType = ROLE_CLIENTE,
  businessName = ''
}) => {
  const normalizedEmail = String(correo).trim().toLowerCase()
  const normalizedAccountType = accountType === ROLE_OWNER ? ROLE_OWNER : ROLE_CLIENTE

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
    const currentUser = userCredential.user
    let negocioId = null

    if (nombre?.trim()) {
      await updateProfile(currentUser, { displayName: nombre.trim() })
    }

    if (normalizedAccountType === ROLE_OWNER) {
      const cleanBusinessName = String(businessName).trim()

      if (!cleanBusinessName) {
        throw new Error('business_name_required')
      }

      negocioId = await createBusiness({
        nombre: cleanBusinessName,
        ownerId: currentUser.uid,
        ownerEmail: normalizedEmail
      })
    }

    await setDoc(
      doc(db, 'usuarios', currentUser.uid),
      {
        uid: currentUser.uid,
        nombre: nombre?.trim() ?? '',
        email: normalizedEmail,
        role: normalizedAccountType,
        negocioId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )

    return currentUser
  } catch (error) {
    console.error(error)
    throw error
  }
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

  if (error?.message === 'business_name_required') {
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
    default:
      return 'Ocurrió un error. Intenta nuevamente.'
  }
}
