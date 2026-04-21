<script setup>
import { computed, ref } from 'vue'
import {
  deleteAppointment,
  getAppointmentsByPhone
} from '../services/appointmentService'
import AppointmentList from './AppointmentList.vue'
import AppointmentForm from './AppointmentForm.vue'
import PhoneNumberField from './PhoneNumberField.vue'
import {
  buildPhoneNumber,
  DEFAULT_COUNTRY_CODE,
  getPhoneRequirementMessage,
  validateLocalPhoneByCountry
} from '../utils/phoneUtils'

const countryCode = ref(DEFAULT_COUNTRY_CODE)
const localPhone = ref('')
const loadingSearch = ref(false)
const processingId = ref('')
const appointments = ref([])
const selectedAppointment = ref(null)
const message = ref({ type: '', text: '' })
const hasSearched = ref(false)
const phoneValidation = computed(() =>
  validateLocalPhoneByCountry(countryCode.value, localPhone.value)
)
const phoneErrorMessage = computed(() => {
  if (!localPhone.value) return ''
  return phoneValidation.value.isValid ? '' : phoneValidation.value.message
})
const phoneHelperMessage = computed(() => getPhoneRequirementMessage(countryCode.value))

const resetFeedback = () => {
  message.value = { type: '', text: '' }
}

const runSearch = async () => {
  if (loadingSearch.value) return

  const cleanPhone = buildPhoneNumber(countryCode.value, localPhone.value)
  resetFeedback()

  if (!cleanPhone || !phoneValidation.value.isValid) {
    message.value = {
      type: 'error',
      text:
        phoneValidation.value.message ||
        'Selecciona tu indicativo e ingresa un número de teléfono válido.'
    }
    return
  }

  loadingSearch.value = true

  try {
    const result = await getAppointmentsByPhone(cleanPhone)
    appointments.value = result
    hasSearched.value = true

    if (!result.length) {
      message.value = {
        type: 'error',
        text: 'No se encontraron citas asociadas a ese número'
      }
      return
    }

    message.value = {
      type: 'success',
      text: 'Estas son las citas asociadas a tu teléfono.'
    }
  } catch (error) {
    console.error(error)
    message.value = {
      type: 'error',
      text: 'No se pudo consultar la cita. Intenta nuevamente.'
    }
  } finally {
    loadingSearch.value = false
  }
}

const refreshAppointments = async () => {
  const normalizedPhone = buildPhoneNumber(countryCode.value, localPhone.value)

  if (!normalizedPhone) return

  const refreshedData = await getAppointmentsByPhone(normalizedPhone)
  appointments.value = refreshedData

  if (!selectedAppointment.value?.id) return

  const stillExists = refreshedData.find((item) => item.id === selectedAppointment.value.id)

  if (!stillExists) {
    selectedAppointment.value = null
  } else {
    selectedAppointment.value = { ...stillExists }
  }
}

const handlePrepareReschedule = (appointment) => {
  selectedAppointment.value = { ...appointment }
  resetFeedback()
  document
    .getElementById('customer-reschedule-form')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleCancelSelection = () => {
  selectedAppointment.value = null
}

const handleReschedule = async () => {
  resetFeedback()

  try {
    await refreshAppointments()
    message.value = {
      type: 'success',
      text: 'Cita reagendada correctamente.'
    }
    selectedAppointment.value = null
  } catch (error) {
    console.error(error)

    message.value = {
      type: 'error',
      text: 'No se pudo reagendar la cita. Intenta nuevamente.'
    }
  }
}

const handleCancelAppointment = async (appointment) => {
  if (processingId.value) return

  const accepted = window.confirm(
    `¿Deseas cancelar tu cita de ${appointment.fecha} a las ${appointment.hora}?`
  )

  if (!accepted) return

  processingId.value = appointment.id
  resetFeedback()

  try {
    await deleteAppointment(appointment.id)
    await refreshAppointments()
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
  <section class="panel-card lookup-section">
    <header class="lookup-header">
      <h2>Consulta tu cita</h2>
      <p>
        Selecciona tu indicativo e ingresa tu número para consultar, reagendar o cancelar tu
        reserva.
      </p>
    </header>

    <form class="lookup-form" @submit.prevent="runSearch">
      <PhoneNumberField
        v-model:country-code="countryCode"
        v-model:local-number="localPhone"
        :disabled="loadingSearch"
        :required="true"
        label="Teléfono"
        placeholder="Ej: 3105622260"
        :error-message="phoneErrorMessage"
        :helper="phoneHelperMessage"
      />
      <button class="btn btn-secondary" type="submit" :disabled="loadingSearch">
        {{ loadingSearch ? 'Consultando...' : 'Consultar' }}
      </button>
    </form>

    <p v-if="message.text" :class="['feedback-message', message.type]">
      {{ message.text }}
    </p>

    <AppointmentList
      v-if="hasSearched"
      :appointments="appointments"
      :loading="loadingSearch"
      :processing-id="processingId"
      :show-edit="true"
      :show-delete="true"
      edit-label="Reagendar"
      cancel-label="Cancelar"
      @edit="handlePrepareReschedule"
      @cancel="handleCancelAppointment"
    />

    <section v-if="selectedAppointment" id="customer-reschedule-form" class="reschedule-wrapper">
      <AppointmentForm
        mode="reschedule"
        :appointment-to-edit="selectedAppointment"
        card-title="Reagendar cita"
        card-description="Actualiza el servicio, la fecha o la hora de tu cita."
        @updated="handleReschedule"
        @cancel-edit="handleCancelSelection"
      />
    </section>
  </section>
</template>

<style scoped>
.lookup-section {
  display: grid;
  gap: 1rem;
}

.lookup-header h2 {
  margin: 0;
  color: var(--primary);
}

.lookup-header p {
  margin: 0.5rem 0 0;
  color: #4f6a45;
}

.lookup-form {
  display: flex;
  align-items: end;
  gap: 0.65rem;
}

.lookup-form :deep(.phone-field) {
  flex: 1;
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

.reschedule-wrapper {
  margin-top: 0.35rem;
}

@media (max-width: 680px) {
  .lookup-form {
    flex-direction: column;
    align-items: stretch;
  }

  .lookup-form button {
    width: 100%;
  }
}
</style>
