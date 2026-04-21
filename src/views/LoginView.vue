<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { getAuthErrorMessage, loginUser } from '../services/authService'

const router = useRouter()
const route = useRoute()
const { refreshAuthUser, isOwner, isClient, profileError } = useAuth()

const form = reactive({
  correo: '',
  password: ''
})

const loading = ref(false)
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

        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
        </button>

        <p v-if="message" class="feedback-message error">{{ message }}</p>
      </form>

      <p class="helper-text">
        ¿No tienes cuenta?
        <RouterLink to="/registro">Crear cuenta</RouterLink>
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
</style>
