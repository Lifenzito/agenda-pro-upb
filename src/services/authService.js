import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { createBusiness } from './businessService'
import { ROLE_CLIENTE, ROLE_OWNER } from '../utils/roleHelpers'

const rollbackAuthUser = async (firebaseUser) => {
  if (!firebaseUser) return
  try {
    await deleteUser(firebaseUser)
  } catch (rollbackError) {
    console.error('No se pudo revertir el Auth user tras un registro fallido:', rollbackError)
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
    await rollbackAuthUser(currentUser)
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
    await rollbackAuthUser(currentUser)
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
    await rollbackAuthUser(currentUser)
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
