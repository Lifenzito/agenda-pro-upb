<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppointmentForm from '../components/AppointmentForm.vue'
import PublicBusinessHeader from '../components/PublicBusinessHeader.vue'
import { useAuth } from '../composables/useAuth'
import { getBusinessBySlug } from '../services/businessService'
import { getActiveStaffByBusiness } from '../services/staffService'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

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

    try {
      workers.value = await getActiveStaffByBusiness(found.id)
    } catch (workerError) {
      console.error(workerError)
      workers.value = []
    }
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se pudo cargar el negocio. Intenta nuevamente.'
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

      <section class="form-card">
        <AppointmentForm
          mode="create"
          :card-title="`Agenda en ${businessName}`"
          card-description="Completa la información para reservar tu cita en este negocio."
          :current-user="user"
          :locked-business-id="business.id"
          @saved="handleSaved"
        />
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
</style>
