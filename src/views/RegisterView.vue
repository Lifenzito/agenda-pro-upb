<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import RegisterTypeSelector from '../components/RegisterTypeSelector.vue'
import { useAuth } from '../composables/useAuth'
import { getAuthErrorMessage, registerUser } from '../services/authService'
import { ROLE_CLIENTE, ROLE_OWNER } from '../utils/roleHelpers'

const router = useRouter()
const { refreshAuthUser, setSuppressProfileError } = useAuth()

const form = reactive({
  nombre: '',
  correo: '',
  password: '',
  confirmPassword: '',
  tipoCuenta: ROLE_CLIENTE,
  nombreNegocio: ''
})

const loading = ref(false)
const message = ref({ type: '', text: '' })

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6
const isOwnerAccount = computed(() => form.tipoCuenta === ROLE_OWNER)

const handleSubmit = async () => {
  if (loading.value) return

  message.value = { type: '', text: '' }

  if (!form.nombre.trim() || !form.correo.trim() || !form.password || !form.confirmPassword) {
    message.value = { type: 'error', text: 'Todos los campos son obligatorios.' }
    return
  }

  if (!emailRegex.test(form.correo.trim())) {
    message.value = { type: 'error', text: 'Ingresa un correo válido.' }
    return
  }

  if (form.password.length < MIN_PASSWORD_LENGTH) {
    message.value = {
      type: 'error',
      text: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    }
    return
  }

  if (form.password !== form.confirmPassword) {
    message.value = { type: 'error', text: 'La confirmación de contraseña no coincide.' }
    return
  }

  if (isOwnerAccount.value && !form.nombreNegocio.trim()) {
    message.value = { type: 'error', text: 'Ingresa el nombre del negocio para continuar.' }
    return
  }

  loading.value = true
  setSuppressProfileError(true)

  try {
    await registerUser({
      nombre: form.nombre,
      correo: form.correo,
      password: form.password,
      accountType: form.tipoCuenta,
      businessName: form.nombreNegocio
    })

    setSuppressProfileError(false)
    await refreshAuthUser()

    message.value = { type: 'success', text: 'Cuenta creada correctamente. Redirigiendo...' }

    setTimeout(() => {
      router.push(isOwnerAccount.value ? '/panel-negocio' : '/mis-citas')
    }, 800)
  } catch (error) {
    console.error('Registro falló. Código:', error?.code, 'Mensaje:', error?.message, error)
    message.value = { type: 'error', text: getAuthErrorMessage(error) }
  } finally {
    setSuppressProfileError(false)
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-view app-container">
    <article class="panel-card auth-card">
      <header class="auth-header">
        <h1>Crear cuenta</h1>
        <p>Regístrate para ver y administrar tus citas desde un único lugar.</p>
      </header>

      <form class="auth-form" @submit.prevent="handleSubmit" novalidate>
        <RegisterTypeSelector v-model="form.tipoCuenta" />

        <label class="field">
          <span>Nombre</span>
          <input
            v-model="form.nombre"
            type="text"
            placeholder="Ej: Ana Martínez"
            autocomplete="name"
            :disabled="loading"
            required
          />
        </label>

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
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
            :disabled="loading"
            required
          />
        </label>

        <label class="field">
          <span>Confirmar contraseña</span>
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="Repite la contraseña"
            autocomplete="new-password"
            :disabled="loading"
            required
          />
        </label>

        <label class="field">
          <span>Tipo de cuenta</span>
          <input
            :value="isOwnerAccount ? 'Dueño de negocio' : 'Cliente'"
            type="text"
            disabled
          />
        </label>

        <label v-if="isOwnerAccount" class="field">
          <span>Nombre del negocio</span>
          <input
            v-model="form.nombreNegocio"
            type="text"
            placeholder="Ej: Barbería Lifeng"
            :disabled="loading"
            required
          />
          <small class="helper-inline">
            Este será el local base para administrar citas desde tu panel de negocio.
          </small>
        </label>

        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Creando cuenta...' : 'Registrarme' }}
        </button>

        <p v-if="message.text" :class="['feedback-message', message.type]">
          {{ message.text }}
        </p>
      </form>

      <p class="helper-text">
        ¿Ya tienes cuenta?
        <RouterLink to="/login">Iniciar sesión</RouterLink>
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
  width: min(560px, 100%);
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

.field select {
  width: 100%;
  border: 1px solid #c7dfd3;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background-color: #f3faf6;
  color: #56724b;
}

.field input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 103, 71, 0.12);
  outline: none;
}

.helper-inline {
  color: #658058;
  font-weight: 600;
  font-size: 0.82rem;
}

.feedback-message {
  margin: 0;
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  font-weight: 600;
}

.feedback-message.success {
  background-color: rgba(30, 125, 50, 0.12);
  color: #1e7d32;
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
