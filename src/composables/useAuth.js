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
  initialized: false
})

let stopObserver = null
let initPromise = null

const setGuestState = () => {
  state.user = null
  state.profile = null
  state.isAuthenticated = false
  state.isOwner = false
  state.isClient = false
}

const setUserState = async (firebaseUser) => {
  if (!firebaseUser) {
    setGuestState()
    return
  }

  let profile = null

  try {
    profile = await getUserProfile(firebaseUser.uid)
  } catch (error) {
    console.error(error)
  }

  const role = String(profile?.role ?? '').toLowerCase()
  const isLegacyAdmin = role === 'admin'
  const isOwner = isOwnerRole(role) || isLegacyAdmin

  state.user = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName ?? profile?.nombre ?? '',
    email: String(firebaseUser.email ?? '').toLowerCase()
  }
  state.profile = profile
  state.isAuthenticated = true
  state.isOwner = isOwner
  state.isClient = isClientRole(role) || (!isOwner && !role)
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
  disposeAuth
})
