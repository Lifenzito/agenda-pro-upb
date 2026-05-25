<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppointmentForm from '../components/AppointmentForm.vue'
import PublicBusinessHeader from '../components/PublicBusinessHeader.vue'
import { useAuth } from '../composables/useAuth'
import { getAuthErrorMessage, loginWithGoogle } from '../services/authService'
import { getBusinessBySlug } from '../services/businessService'
import { getActiveStaffByBusiness } from '../services/staffService'
import { saveRecentBusiness } from '../utils/recentBusinesses'

const route = useRoute()
const router = useRouter()
const {
  user,
  isAuthenticated,
  isOwner,
  isClient,
  loading: authLoading,
  performLogout
} = useAuth()

const publicPath = computed(() => `/negocio/${route.params.slug ?? ''}`)
const canBook = computed(() => isAuthenticated.value && isClient.value && !isOwner.value)
const showOwnerNotice = computed(() => isAuthenticated.value && isOwner.value)
const showGuestCta = computed(() => !authLoading.value && !isAuthenticated.value)

const goToLogin = () => {
  router.push({ path: '/login', query: { redirect: publicPath.value } })
}

const goToRegister = () => {
  router.push({ path: '/registro', query: { redirect: publicPath.value } })
}

const goToOwnerPanel = () => {
  router.push('/panel-negocio')
}

const googleLoading = ref(false)
const googleError = ref('')

const handleGoogleSignIn = async () => {
  if (googleLoading.value) return

  googleError.value = ''
  googleLoading.value = true

  try {
    await loginWithGoogle()
    const { refreshAuthUser } = useAuth()
    await refreshAuthUser()
  } catch (error) {
    console.error(error)
    if (error?.code !== 'auth/popup-closed-by-user') {
      googleError.value = getAuthErrorMessage(error)
    }
  } finally {
    googleLoading.value = false
  }
}

const loggingOut = ref(false)
const handleLogout = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await performLogout()
  } catch (error) {
    console.error(error)
  } finally {
    loggingOut.value = false
  }
}

const business = ref(null)
const workers = ref([])
const loading = ref(true)
const notFound = ref(false)
const errorMessage = ref('')

const businessName = computed(() => String(business.value?.nombre ?? '').trim())
const services = computed(() => {
  const list = Array.isArray(business.value?.servicios) ? business.value.servicios : []
  return list.map((service) => String(service ?? '').trim()).filter(Boolean)
})

const loadBusiness = async (slug) => {
  loading.value = true
  notFound.value = false
  errorMessage.value = ''
  business.value = null
  workers.value = []

  try {
    const found = await getBusinessBySlug(slug)

    if (!found) {
      notFound.value = true
      return
    }

    business.value = found

    saveRecentBusiness({
      slug: slug,
      nombre: String(found.nombre ?? '').trim(),
      fotoPerfilURL: String(found.fotoPerfilURL ?? '').trim()
    })

    try {
      workers.value = await getActiveStaffByBusiness(found.id)
    } catch (workerError) {
      console.error(workerError)
      workers.value = []
    }
  } catch (error) {
    console.error(error)
    const code = String(error?.code ?? '').toLowerCase()
    if (code === 'permission-denied') {
      errorMessage.value =
        'Esta página pública no puede leer el negocio. El administrador debe habilitar lectura pública de las colecciones "negocios" y "trabajadores" en las reglas de Firestore.'
    } else {
      errorMessage.value = 'No se pudo cargar el negocio. Intenta nuevamente.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBusiness(route.params.slug)
})

watch(
  () => route.params.slug,
  (newSlug, oldSlug) => {
    if (newSlug && newSlug !== oldSlug) {
      loadBusiness(newSlug)
    }
  }
)

const handleSaved = () => {
  errorMessage.value = ''
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <main class="public-page">
    <div v-if="loading" class="status panel-card">
      <p>Cargando información del negocio…</p>
    </div>

    <div v-else-if="notFound" class="status panel-card not-found">
      <h1>Negocio no encontrado</h1>
      <p>
        El link que intentaste abrir no corresponde a ningún negocio activo en AgendaPro.
      </p>
      <button class="btn btn-primary" type="button" @click="goHome">Volver al inicio</button>
    </div>

    <div v-else-if="errorMessage" class="status panel-card error">
      <p>{{ errorMessage }}</p>
      <button class="btn btn-primary" type="button" @click="loadBusiness(route.params.slug)">
        Reintentar
      </button>
    </div>

    <template v-else-if="business">
      <PublicBusinessHeader :business="business" />

      <aside v-if="showOwnerNotice" class="admin-pill">
        <div class="admin-pill__text">
          <strong>Vista de administrador</strong>
          <span>Estás visualizando la página pública de tu negocio.</span>
        </div>
        <div class="admin-pill__actions">
          <button class="btn btn-secondary btn-sm" type="button" @click="goToOwnerPanel">
            Ir al panel
          </button>
          <button
            class="btn btn-secondary btn-sm"
            type="button"
            :disabled="loggingOut"
            @click="handleLogout"
          >
            {{ loggingOut ? 'Cerrando…' : 'Cerrar sesión' }}
          </button>
        </div>
      </aside>

      <section class="panel-card info-card">
        <h2>Servicios</h2>
        <div v-if="services.length" class="chip-grid">
          <span v-for="service in services" :key="service" class="chip">{{ service }}</span>
        </div>
        <p v-else class="empty">Este negocio aún no ha publicado servicios.</p>
      </section>

      <section class="panel-card info-card">
        <h2>Especialistas activos</h2>
        <div v-if="workers.length" class="worker-grid">
          <article
            v-for="worker in workers"
            :key="worker.id"
            class="worker-card"
          >
            <h3>{{ worker.nombre }}</h3>
            <p v-if="worker.rol" class="role">{{ worker.rol }}</p>
            <p v-if="worker.descripcion" class="description">{{ worker.descripcion }}</p>
            <div v-if="worker.serviciosAsignados?.length" class="chip-grid small">
              <span
                v-for="service in worker.serviciosAsignados"
                :key="`${worker.id}-${service}`"
                class="chip light"
              >
                {{ service }}
              </span>
            </div>
          </article>
        </div>
        <p v-else class="empty">
          Este negocio todavía no tiene especialistas activos. Puedes agendar y se asignará
          al equipo disponible.
        </p>
      </section>

      <section v-if="authLoading" class="panel-card auth-gate">
        <p>Cargando tu sesión…</p>
      </section>

      <section v-else-if="showOwnerNotice" class="panel-card auth-gate owner-admin-empty">
        <p>El formulario de reserva no está disponible para cuentas administrativas.</p>
      </section>

      <section v-else-if="showGuestCta" class="panel-card auth-gate guest-cta">
        <h2>Inicia sesión para agendar una cita con nosotros</h2>
        <p>Accede con tu cuenta de cliente para reservar tu turno en este negocio.</p>
        <div class="auth-actions">
          <button
            class="btn btn-google"
            type="button"
            :disabled="googleLoading"
            @click="handleGoogleSignIn"
          >
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {{ googleLoading ? 'Conectando...' : 'Continuar con Google' }}
          </button>
        </div>
        <p v-if="googleError" class="feedback-message error">{{ googleError }}</p>
        <div class="alt-auth">
          <button class="link-btn" type="button" @click="goToLogin">Iniciar sesión con correo</button>
          <span class="alt-sep">·</span>
          <button class="link-btn" type="button" @click="goToRegister">Crear cuenta</button>
        </div>
      </section>

      <section v-else-if="canBook" class="form-card">
        <AppointmentForm
          mode="create"
          :card-title="`Agenda en ${businessName}`"
          card-description="Completa la información para reservar tu cita en este negocio."
          :current-user="user"
          :locked-business-id="business.id"
          @saved="handleSaved"
        />
      </section>

      <section v-else class="panel-card auth-gate">
        <p>
          Tu cuenta no puede agendar citas en este negocio. Si crees que es un error, contacta
          al administrador del negocio.
        </p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.public-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  display: grid;
  gap: 1.5rem;
}

.status {
  text-align: center;
  padding: 2rem 1.5rem;
}

.status h1 {
  margin: 0 0 0.5rem;
  color: var(--primary);
}

.status p {
  margin: 0 0 1rem;
  color: #5d7a53;
}

.info-card h2 {
  margin: 0 0 0.75rem;
  color: var(--primary);
  font-size: 1.15rem;
}

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  background-color: #e9f7ef;
  color: #006747;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.chip.light {
  background-color: #f1f7ee;
  color: #2f6b3d;
  font-size: 0.8rem;
  padding: 0.25rem 0.65rem;
}

.empty {
  margin: 0;
  color: #5d7a53;
  font-size: 0.95rem;
}

.worker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.worker-card {
  border: 1px solid #d9ecdf;
  border-radius: 14px;
  padding: 1rem;
  background-color: #fff;
  display: grid;
  gap: 0.4rem;
}

.worker-card h3 {
  margin: 0;
  color: var(--text-dark);
  font-size: 1rem;
}

.worker-card .role {
  margin: 0;
  color: #006747;
  font-weight: 600;
  font-size: 0.85rem;
}

.worker-card .description {
  margin: 0;
  color: #5d7a53;
  font-size: 0.85rem;
}

.form-card {
  display: block;
}

.auth-gate {
  display: grid;
  gap: 0.6rem;
  text-align: center;
  padding: 1.5rem 1.25rem;
}

.auth-gate h2 {
  margin: 0;
  color: var(--primary);
}

.auth-gate p {
  margin: 0;
  color: #4f6a45;
}

.auth-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 0.4rem;
}

.owner-admin-empty {
  padding: 1rem 1.25rem;
}

.owner-admin-empty p {
  color: #6b855f;
  font-size: 0.9rem;
}

.admin-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid #c7dfd3;
  background: #f1f8f2;
  font-size: 0.9rem;
}

.admin-pill__text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.admin-pill__text strong {
  color: var(--primary);
  font-weight: 700;
}

.admin-pill__text span {
  color: #4f6a45;
  font-size: 0.85rem;
}

.admin-pill__actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  border-radius: 10px;
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.75rem 1.2rem;
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

.alt-auth {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link-btn:hover {
  color: #0a7f58;
}

.alt-sep {
  color: #9db894;
  font-size: 0.85rem;
}
</style>
