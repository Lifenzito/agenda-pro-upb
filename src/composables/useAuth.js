import { reactive, toRefs } from 'vue'
import {
  getCurrentAuthUser,
  getUserProfile,
  logoutUser,
  observeAuthState
} from '../services/authService'
import { isClientRole, isOwnerRole } from '../utils/roleHelpers'

const state = reactive({
  user: null,
  profile: null,
  isAuthenticated: false,
  isOwner: false,
  isClient: false,
  loading: true,
  initialized: false,
  profileError: '',
  suppressProfileError: false
})

let stopObserver = null
let initPromise = null

const setGuestState = () => {
  state.user = null
  state.profile = null
  state.isAuthenticated = false
  state.isOwner = false
  state.isClient = false
  state.profileError = ''
}

const setSuppressProfileError = (value) => {
  state.suppressProfileError = Boolean(value)
  if (!state.suppressProfileError) return
  if (state.profileError) state.profileError = ''
}

const setUserState = async (firebaseUser) => {
  if (!firebaseUser) {
    setGuestState()
    return
  }

  state.user = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName ?? '',
    email: String(firebaseUser.email ?? '').toLowerCase()
  }
  state.isAuthenticated = true

  let profile = null
  let readFailed = false

  try {
    profile = await getUserProfile(firebaseUser.uid)
  } catch (error) {
    console.error('No se pudo leer el perfil del usuario en Firestore:', error)
    readFailed = true
  }

  if (readFailed) {
    state.profile = null
    state.isOwner = false
    state.isClient = false
    state.profileError = state.suppressProfileError ? '' : 'read_failed'
    return
  }

  if (!profile) {
    state.profile = null
    state.isOwner = false
    state.isClient = false
    state.profileError = state.suppressProfileError ? '' : 'missing'
    return
  }

  const role = String(profile?.role ?? '').toLowerCase()
  const isLegacyAdmin = role === 'admin'
  const resolvedOwner = isOwnerRole(role) || isLegacyAdmin
  const resolvedClient = isClientRole(role)

  if (!resolvedOwner && !resolvedClient) {
    state.profile = profile
    state.isOwner = false
    state.isClient = false
    state.profileError = state.suppressProfileError ? '' : 'missing'
    return
  }

  state.user = {
    ...state.user,
    displayName: state.user.displayName || profile?.nombre || ''
  }
  state.profile = profile
  state.isOwner = resolvedOwner
  state.isClient = resolvedClient && !resolvedOwner
  state.profileError = ''
}

const initAuth = () => {
  if (initPromise) return initPromise

  state.loading = true
  state.initialized = true

  initPromise = new Promise((resolve) => {
    let firstResolutionDone = false

    stopObserver = observeAuthState(async (firebaseUser) => {
      await setUserState(firebaseUser)
      state.loading = false

      if (!firstResolutionDone) {
        firstResolutionDone = true
        resolve()
      }
    })
  })

  return initPromise
}

const refreshAuthUser = async () => {
  const currentUser = getCurrentAuthUser()
  await setUserState(currentUser)
}

const performLogout = async () => {
  await logoutUser()
  setGuestState()
}

const disposeAuth = () => {
  if (stopObserver) {
    stopObserver()
    stopObserver = null
  }

  initPromise = null
  state.initialized = false
  state.loading = true
}

export const useAuth = () => ({
  ...toRefs(state),
  initAuth,
  refreshAuthUser,
  performLogout,
  disposeAuth,
  setSuppressProfileError
})
