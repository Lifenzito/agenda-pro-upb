<script setup>
/**
 * Vista de inicio de sesión.
 * Gestiona autenticación y redirección según el rol del usuario.
 */
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { getAuthErrorMessage, loginUser, loginWithGoogle } from '../services/authService'

const router = useRouter()
const route = useRoute()
const { refreshAuthUser, isOwner, isClient, profileError } = useAuth()

const form = reactive({
  correo: '',
  password: ''
})

const loading = ref(false)
const googleLoading = ref(false)
const message = ref('')

onMounted(() => {
  if (route.query.error === 'profile') {
    message.value = 'Tu perfil no se pudo cargar. Vuelve a iniciar sesión o contacta al administrador.'
  }
})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const handleSubmit = async () => {
  if (loading.value) return

  message.value = ''

  if (!form.correo.trim() || !form.password.trim()) {
    message.value = 'Completa correo y contraseña.'
    return
  }

  if (!emailRegex.test(form.correo.trim())) {
    message.value = 'Ingresa un correo válido.'
    return
  }

  loading.value = true

  try {
    await loginUser({
      correo: form.correo,
      password: form.password
    })

    await refreshAuthUser()

    if (profileError.value) {
      message.value =
        profileError.value === 'read_failed'
          ? 'Iniciaste sesión pero no pudimos leer tu perfil. Intenta más tarde o contacta al administrador.'
          : 'Tu cuenta no tiene un perfil válido. Contacta al administrador para completarla.'
      return
    }

    let defaultRedirect = '/'
    if (isOwner.value) defaultRedirect = '/panel-negocio'
    else if (isClient.value) defaultRedirect = '/mis-citas'

    const redirectPath = String(route.query.redirect ?? defaultRedirect)
    router.push(redirectPath)
  } catch (error) {
    console.error(error)
    message.value = getAuthErrorMessage(error)
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  if (googleLoading.value || loading.value) return

  message.value = ''
  googleLoading.value = true

  try {
    await loginWithGoogle()
    await refreshAuthUser()

    let defaultRedirect = '/'
    if (isOwner.value) defaultRedirect = '/panel-negocio'
    else if (isClient.value) defaultRedirect = '/mis-citas'

    const redirectPath = String(route.query.redirect ?? defaultRedirect)
    router.push(redirectPath)
  } catch (error) {
    console.error(error)
    if (error?.code !== 'auth/popup-closed-by-user') {
      message.value = getAuthErrorMessage(error)
    }
  } finally {
    googleLoading.value = false
  }
}
</script>

<template>
  <section class="auth-view app-container">
    <article class="panel-card auth-card">
      <header class="auth-header">
        <h1>Iniciar sesión</h1>
        <p>Accede para gestionar tus citas y mantener el control de tu agenda.</p>
      </header>

      <form class="auth-form" @submit.prevent="handleSubmit" novalidate>
        <label class="field">
          <span>Correo</span>
          <input
            v-model="form.correo"
            type="email"
            placeholder="correo@ejemplo.com"
            autocomplete="email"
            :disabled="loading"
            required
          />
        </label>

        <label class="field">
          <span>Contraseña</span>
          <input
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="loading"
            required
          />
        </label>

        <button class="btn btn-primary" type="submit" :disabled="loading || googleLoading">
          {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
        </button>

        <div class="divider"><span>o</span></div>

        <button
          class="btn btn-google"
          type="button"
          :disabled="loading || googleLoading"
          @click="handleGoogleLogin"
        >
          <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ googleLoading ? 'Conectando...' : 'Continuar con Google' }}
        </button>

        <p v-if="message" class="feedback-message error">{{ message }}</p>
      </form>

      <p class="helper-text">
        ¿No tienes cuenta?
        <RouterLink :to="{ path: '/registro', query: route.query.redirect ? { redirect: route.query.redirect } : {} }">
          Crear cuenta
        </RouterLink>
      </p>
    </article>
  </section>
</template>

<style scoped>
.auth-view {
  display: grid;
  place-items: center;
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.auth-card {
  width: min(520px, 100%);
}

.auth-header h1 {
  margin: 0;
  color: var(--primary);
}

.auth-header p {
  margin: 0.5rem 0 0;
  color: #4f6a45;
}

.auth-form {
  margin-top: 1rem;
  display: grid;
  gap: 0.8rem;
}

.field {
  display: grid;
  gap: 0.4rem;
}

.field span {
  color: var(--text-dark);
  font-weight: 600;
}

.field input {
  width: 100%;
  border: 1px solid #c7dfd3;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background-color: #fcfffd;
  color: var(--text-dark);
}

.field input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 103, 71, 0.12);
  outline: none;
}

.feedback-message {
  margin: 0;
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  font-weight: 600;
}

.feedback-message.error {
  background-color: rgba(179, 38, 30, 0.12);
  color: #b3261e;
}

.helper-text {
  margin: 1rem 0 0;
  color: #4f6a45;
}

.helper-text a {
  color: var(--primary);
  font-weight: 700;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.2rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: #d1e3d8;
}

.divider span {
  color: #7a9c6f;
  font-size: 0.85rem;
  font-weight: 600;
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1e3d8;
  border-radius: 12px;
  background: #fff;
  color: var(--text-dark);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.btn-google:hover:not(:disabled) {
  border-color: #9dc59b;
  box-shadow: 0 4px 12px rgba(0, 103, 71, 0.08);
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  flex-shrink: 0;
}
</style>
