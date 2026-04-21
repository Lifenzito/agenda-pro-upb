<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppointmentForm from '../components/AppointmentForm.vue'
import AppointmentList from '../components/AppointmentList.vue'
import { useAuth } from '../composables/useAuth'
import {
  deleteAppointment,
  getAppointmentsByUser
} from '../services/appointmentService'

const { user, isAuthenticated, loading: authLoading, initAuth } = useAuth()

const appointments = ref([])
const loadingAppointments = ref(false)
const processingId = ref('')
const selectedAppointment = ref(null)
const message = ref({ type: '', text: '' })

const resetMessage = () => {
  message.value = { type: '', text: '' }
}

const loadAppointments = async () => {
  if (!isAuthenticated.value || !user.value) {
    appointments.value = []
    return
  }

  loadingAppointments.value = true
  resetMessage()

  try {
    appointments.value = await getAppointmentsByUser(user.value)
  } catch (error) {
    console.error(error)
    message.value = {
      type: 'error',
      text: 'No se pudieron cargar tus citas. Intenta nuevamente.'
    }
  } finally {
    loadingAppointments.value = false
  }
}

onMounted(async () => {
  await initAuth()
  await loadAppointments()
})

watch(
  () => user.value?.uid,
  async () => {
    await loadAppointments()
  }
)

const handlePrepareReschedule = (appointment) => {
  selectedAppointment.value = { ...appointment }
  resetMessage()
  document.getElementById('my-reschedule-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleReschedule = async () => {
  await loadAppointments()
  selectedAppointment.value = null
  message.value = {
    type: 'success',
    text: 'Cita reagendada correctamente.'
  }
}

const handleCancelSelection = () => {
  selectedAppointment.value = null
}

const handleCancelAppointment = async (appointment) => {
  if (processingId.value) return

  const accepted = window.confirm(
    `¿Deseas cancelar tu cita de ${appointment.fecha} a las ${appointment.hora}?`
  )

  if (!accepted) return

  processingId.value = appointment.id
  resetMessage()

  try {
    await deleteAppointment(appointment.id)
    await loadAppointments()
    message.value = {
      type: 'success',
      text: 'Tu cita fue cancelada correctamente.'
    }
  } catch (error) {
    console.error(error)
    message.value = {
      type: 'error',
      text: 'No se pudo cancelar la cita. Intenta nuevamente.'
    }
  } finally {
    processingId.value = ''
  }
}
</script>

<template>
  <section class="my-appointments-view app-container">
    <header class="panel-card view-header">
      <h1>Mis citas</h1>
      <p>Consulta tus citas con especialista asignado, reagenda cuando lo necesites o cancela en segundos.</p>
    </header>

    <section v-if="authLoading" class="panel-card empty-auth-state">
      <p>Cargando sesión...</p>
    </section>

    <section v-else-if="!isAuthenticated" class="panel-card empty-auth-state">
      <p>Debes iniciar sesión para acceder a tus citas.</p>
      <RouterLink class="btn btn-primary" to="/login">Ir a login</RouterLink>
    </section>

    <template v-else>
      <p v-if="message.text" :class="['feedback-message', message.type]">
        {{ message.text }}
      </p>

      <AppointmentList
        :appointments="appointments"
        :loading="loadingAppointments"
        :processing-id="processingId"
        :show-edit="true"
        :show-delete="true"
        edit-label="Reagendar"
        cancel-label="Cancelar"
        @edit="handlePrepareReschedule"
        @cancel="handleCancelAppointment"
      />

      <section v-if="selectedAppointment" id="my-reschedule-form">
        <AppointmentForm
          mode="reschedule"
          :appointment-to-edit="selectedAppointment"
          card-title="Reagendar cita"
          card-description="Actualiza el servicio, la fecha o la hora de tu cita."
          @updated="handleReschedule"
          @cancel-edit="handleCancelSelection"
        />
      </section>
    </template>
  </section>
</template>

<style scoped>
.my-appointments-view {
  display: grid;
  gap: 1rem;
  padding-bottom: 1.5rem;
}

.view-header h1 {
  margin: 0;
  color: var(--primary);
}

.view-header p {
  margin: 0.5rem 0 0;
  color: #4f6a45;
}

.empty-auth-state {
  display: grid;
  justify-items: start;
  gap: 0.75rem;
}

.empty-auth-state p {
  margin: 0;
  color: #4f6a45;
  font-weight: 600;
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
</style>
