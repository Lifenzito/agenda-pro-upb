import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import HomeView from '../views/HomeView.vue'
import BookingView from '../views/BookingView.vue'
import AdminView from '../views/AdminView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import MyAppointmentsView from '../views/MyAppointmentsView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/agendar',
    name: 'booking',
    component: BookingView
  },
  {
    path: '/panel-negocio',
    name: 'business-panel',
    component: AdminView,
    meta: {
      requiresAuth: true,
      ownerOnly: true
    }
  },
  {
    path: '/admin',
    redirect: '/panel-negocio'
  },
  {
    path: '/mis-citas',
    name: 'my-appointments',
    component: MyAppointmentsView,
    meta: {
      requiresAuth: true,
      clientOnly: true
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      guestOnly: true
    }
  },
  {
    path: '/registro',
    name: 'register',
    component: RegisterView,
    meta: {
      guestOnly: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  }
})

router.beforeEach(async (to) => {
  const auth = useAuth()
  await auth.initAuth()

  if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (to.meta.requiresAuth && auth.profileError.value) {
    return {
      path: '/login',
      query: { error: 'profile' }
    }
  }

  if (to.meta.ownerOnly && !auth.isOwner.value) {
    return { path: auth.isClient.value ? '/mis-citas' : '/' }
  }

  if (to.meta.clientOnly && auth.isOwner.value) {
    return { path: '/panel-negocio' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated.value && !auth.profileError.value) {
    if (auth.isOwner.value) return { path: '/panel-negocio' }
    if (auth.isClient.value) return { path: '/mis-citas' }
    return { path: '/' }
  }

  return true
})

export default router
