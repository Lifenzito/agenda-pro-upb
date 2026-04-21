<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AdminSidebar from '../components/AdminSidebar.vue'
import AdminDashboard from '../components/AdminDashboard.vue'
import AppointmentList from '../components/AppointmentList.vue'
import BusinessProfileCard from '../components/BusinessProfileCard.vue'
import BusinessStaffManager from '../components/BusinessStaffManager.vue'
import { useAuth } from '../composables/useAuth'
import {
  deleteAppointment,
  getAppointmentsByBusiness
} from '../services/appointmentService'
import {
  getBusinessById,
  getBusinessByOwnerId,
  updateBusiness
} from '../services/businessService'

const appointments = ref([])
const loadingAppointments = ref(true)
const isDeletingId = ref('')
const listErrorMessage = ref('')
const listSuccessMessage = ref('')
const currentSection = ref('general')
const business = ref(null)
const loadingBusiness = ref(true)

const { user, profile, initAuth } = useAuth()

let unsubscribeAppointments = () => {}
let successTimeout = null

const sectionTitle = computed(() => {
  if (currentSection.value === 'business-profile') return 'Información del negocio'
  if (currentSection.value === 'appointments') return 'Gestionar citas'
  if (currentSection.value === 'staff') return 'Especialistas del negocio'
  return 'Resumen del negocio'
})

const sectionDescription = computed(() => {
  if (currentSection.value === 'business-profile') {
    return 'Configura datos clave de tu local para mantener una operación profesional.'
  }

  if (currentSection.value === 'appointments') {
    return 'Visualiza y cancela únicamente las citas registradas en tu negocio.'
  }

  if (currentSection.value === 'staff') {
    return 'Administra el personal de tu negocio y su disponibilidad para asignar citas.'
  }

  return 'Supervisa la agenda y actividad principal de tu negocio desde un solo lugar.'
})

const isGeneralSection = computed(() => currentSection.value === 'general')
const isProfileSection = computed(() => currentSection.value === 'business-profile')
const isStaffSection = computed(() => currentSection.value === 'staff')

const resolveBusinessId = () => {
  if (profile.value?.negocioId) return profile.value.negocioId
  return ''
}

const subscribeBusinessAppointments = (businessId) => {
  unsubscribeAppointments()

  if (!businessId) {
    appointments.value = []
    loadingAppointments.value = false
    return
  }

  loadingAppointments.value = true

  unsubscribeAppointments = getAppointmentsByBusiness(
    businessId,
    (data) => {
      appointments.value = data
      loadingAppointments.value = false
      listErrorMessage.value = ''
    },
    () => {
      loadingAppointments.value = false
      listErrorMessage.value =
        'No fue posible cargar las citas del negocio. Revisa la conexión e intenta nuevamente.'
    }
  )
}

const setSuccessMessage = (text) => {
  listSuccessMessage.value = text
  clearTimeout(successTimeout)
  successTimeout = setTimeout(() => {
    listSuccessMessage.value = ''
  }, 3200)
}

onMounted(() => {
  initAuth().then(async () => {
    loadingBusiness.value = true

    try {
      const businessId = resolveBusinessId()

      if (businessId) {
        business.value = await getBusinessById(businessId)
      } else if (user.value?.uid) {
        business.value = await getBusinessByOwnerId(user.value.uid)
      }

      subscribeBusinessAppointments(business.value?.id ?? '')
    } catch (error) {
      console.error(error)
      listErrorMessage.value = 'No se pudo cargar la información del negocio. Intenta nuevamente.'
      appointments.value = []
      loadingAppointments.value = false
    } finally {
      loadingBusiness.value = false
    }
  })
})

onBeforeUnmount(() => {
  unsubscribeAppointments()
  clearTimeout(successTimeout)
})

const handleSelectSection = (sectionId) => {
  currentSection.value = sectionId

  if (sectionId === 'appointments') {
    document.getElementById('admin-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleGoManage = () => {
  handleSelectSection('appointments')
}

const handleSaveBusinessProfile = async (payload) => {
  if (!business.value?.id) {
    throw new Error('business_not_found')
  }

  await updateBusiness(business.value.id, payload)
  business.value = {
    ...business.value,
    ...payload
  }
}

const handleCancelAppointment = async (appointment) => {
  if (isDeletingId.value) return

  const accepted = window.confirm(
    `¿Seguro que deseas cancelar la cita de ${appointment.clienteNombre} (${appointment.fecha} ${appointment.hora})?`
  )

  if (!accepted) return

  isDeletingId.value = appointment.id
  listErrorMessage.value = ''

  try {
    await deleteAppointment(appointment.id)
    setSuccessMessage('Cita cancelada correctamente.')
  } catch (error) {
    console.error(error)
    listErrorMessage.value = 'No se pudo cancelar la cita. Intenta nuevamente.'
  } finally {
    isDeletingId.value = ''
  }
}
</script>

<template>
  <section class="admin-view app-container">
    <AdminSidebar :current-section="currentSection" @select="handleSelectSection" />

    <div class="admin-content">
      <header class="admin-header panel-card">
        <h1>{{ sectionTitle }}</h1>
        <p>{{ sectionDescription }}</p>
      </header>

      <section v-if="isGeneralSection">
        <AdminDashboard :appointments="appointments" @go-manage="handleGoManage" />
      </section>

      <section v-else-if="isProfileSection">
        <BusinessProfileCard
          v-if="business"
          :business="business"
          :save-handler="handleSaveBusinessProfile"
        />

        <section v-else class="panel-card">
          <p v-if="loadingBusiness">Cargando información del negocio...</p>
          <p v-else>No se encontró información del negocio asociado a esta cuenta.</p>
        </section>
      </section>

      <section v-else-if="isStaffSection">
        <BusinessStaffManager
          v-if="business?.id"
          :business-id="business.id"
          :business-services="business?.servicios ?? []"
        />

        <section v-else class="panel-card">
          <p v-if="loadingBusiness">Cargando información del negocio...</p>
          <p v-else>No se encontró información del negocio asociado a esta cuenta.</p>
        </section>
      </section>

      <section v-else id="admin-list">
        <AppointmentList
          :appointments="appointments"
          :loading="loadingAppointments"
          :processing-id="isDeletingId"
          :error-message="listErrorMessage"
          :success-message="listSuccessMessage"
          :show-edit="false"
          :show-delete="true"
          cancel-label="Cancelar"
          @cancel="handleCancelAppointment"
        />
      </section>
    </div>
  </section>
</template>

<style scoped>
.admin-view {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  padding-bottom: 1.5rem;
}

.admin-content {
  display: grid;
  gap: 1rem;
}

.admin-header h1 {
  margin: 0;
  color: var(--primary);
}

.admin-header p {
  margin: 0.5rem 0 0;
  color: #4f6a45;
}

@media (max-width: 980px) {
  .admin-view {
    grid-template-columns: 1fr;
  }
}
</style>
