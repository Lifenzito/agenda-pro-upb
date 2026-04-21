<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  createAppointment,
  getOccupiedHoursByDate,
  SLOT_TAKEN_ERROR,
  updateAppointment
} from '../services/appointmentService'
import PhoneNumberField from './PhoneNumberField.vue'
import WorkerSelect from './WorkerSelect.vue'
import {
  buildPhoneNumber,
  DEFAULT_COUNTRY_CODE,
  getPhoneRequirementMessage,
  splitPhoneNumber,
  validateLocalPhoneByCountry
} from '../utils/phoneUtils'
import {
  getCurrentTimeString,
  getTodayDateString,
  isDateBeforeToday,
  isTimeInPastForDate
} from '../utils/dateTimeUtils'
import { getAvailableSlots } from '../utils/timeSlots'
import { getBusinesses } from '../services/businessService'
import { getActiveStaffByBusiness, workerCanPerformService } from '../services/staffService'

const props = defineProps({
  mode: {
    type: String,
    default: 'create'
  },
  appointmentToEdit: {
    type: Object,
    default: null
  },
  cardTitle: {
    type: String,
    default: 'Registrar cita'
  },
  cardDescription: {
    type: String,
    default: 'Completa la información para registrar una cita en AgendaPro.'
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['saved', 'updated', 'cancel-edit'])

const initialFormState = {
  clienteNombre: '',
  telefono: '',
  servicio: '',
  fecha: '',
  hora: '',
  negocioId: '',
  trabajadorId: '',
  trabajadorNombre: ''
}

const suggestedServices = [
  'Corte de cabello',
  'Tinte',
  'Manicure',
  'Pedicure',
  'Peinado',
  'Tratamiento capilar'
]

const form = reactive({ ...initialFormState })
const isSubmitting = ref(false)
const message = ref({ type: '', text: '' })
const editingAppointmentId = ref('')
const countryCode = ref(DEFAULT_COUNTRY_CODE)
const localPhone = ref('')
const occupiedHours = ref([])
const businesses = ref([])
const loadingBusinesses = ref(false)
const activeWorkers = ref([])
const loadingWorkers = ref(false)

const isEditing = computed(() => Boolean(editingAppointmentId.value))
const isRescheduleMode = computed(() => props.mode === 'reschedule')
const minDate = computed(() => getTodayDateString())
const phoneValidation = computed(() =>
  validateLocalPhoneByCountry(countryCode.value, localPhone.value)
)
const phoneErrorMessage = computed(() => {
  if (!localPhone.value) return ''
  return phoneValidation.value.isValid ? '' : phoneValidation.value.message
})
const phoneHelperMessage = computed(() => getPhoneRequirementMessage(countryCode.value))
const heading = computed(() => {
  if (isRescheduleMode.value) return 'Reagendar cita'
  return isEditing.value ? 'Editar cita' : props.cardTitle
})
const headingDescription = computed(() =>
  isRescheduleMode.value
    ? 'Puedes cambiar servicio, fecha y hora. Nombre y teléfono no se pueden modificar.'
    : isEditing.value
    ? 'Actualiza los datos de la cita seleccionada y guarda los cambios.'
    : props.cardDescription
)
const lockIdentityFields = computed(() => isRescheduleMode.value && isEditing.value)
const currentBusinessId = computed(() => {
  if (props.mode === 'create') return form.negocioId
  return form.negocioId || props.appointmentToEdit?.negocioId || ''
})
const currentBusiness = computed(() =>
  businesses.value.find((business) => business.id === currentBusinessId.value)
)
const serviceOptions = computed(() => {
  const customServices = Array.isArray(currentBusiness.value?.servicios)
    ? currentBusiness.value.servicios.filter(Boolean)
    : []

  return customServices.length ? customServices : suggestedServices
})
const availableTimeSlots = computed(() =>
  getAvailableSlots({
    selectedDate: form.fecha,
    todayDate: minDate.value,
    currentTime: getCurrentTimeString(),
    occupiedHours: occupiedHours.value,
    excludedHour: isEditing.value ? props.appointmentToEdit?.hora ?? '' : ''
  })
)
const eligibleWorkers = computed(() => {
  const service = String(form.servicio ?? '').trim()

  if (!service) return [...activeWorkers.value]

  return activeWorkers.value.filter((worker) => workerCanPerformService(worker, service))
})
const workerOptions = computed(() => {
  const options = [...eligibleWorkers.value]

  if (!form.trabajadorId || !form.trabajadorNombre) {
    return options
  }

  const alreadyIncluded = options.some((worker) => worker.id === form.trabajadorId)

  if (!alreadyIncluded) {
    options.push({
      id: form.trabajadorId,
      nombre: form.trabajadorNombre,
      rol: 'No disponible',
      especialidad: 'No disponible',
      activo: false
    })
  }

  return options
})
const hasWorkers = computed(() => eligibleWorkers.value.length > 0)
const hasActiveWorkers = computed(() => activeWorkers.value.length > 0)
const workerEmptyLabel = computed(() => {
  if (!hasActiveWorkers.value) return 'Sin especialistas activos'
  if (String(form.servicio ?? '').trim()) return 'Sin especialistas para este servicio'
  return 'Sin especialistas activos'
})
const workerEmptyMessage = computed(() => {
  if (!hasActiveWorkers.value) {
    return 'Este negocio no tiene especialistas activos. La cita se registrará como “Sin asignar”.'
  }

  if (String(form.servicio ?? '').trim()) {
    return 'Ningún especialista activo ofrece el servicio seleccionado. Elige otro servicio o la cita se registrará como “Sin asignar”.'
  }

  return 'Este negocio no tiene especialistas activos. La cita se registrará como “Sin asignar”.'
})
const selectedWorker = computed(() =>
  workerOptions.value.find((worker) => worker.id === form.trabajadorId)
)

const clearForm = () => {
  Object.assign(form, initialFormState)
  countryCode.value = DEFAULT_COUNTRY_CODE
  localPhone.value = ''
  occupiedHours.value = []
}

const loadBusinesses = async () => {
  loadingBusinesses.value = true

  try {
    businesses.value = await getBusinesses()

    if (props.mode === 'create' && !form.negocioId && businesses.value.length) {
      form.negocioId = businesses.value[0].id
    }
  } catch (error) {
    console.error(error)
    businesses.value = []
  } finally {
    loadingBusinesses.value = false
  }
}

loadBusinesses()

const loadWorkersByBusiness = async () => {
  if (!currentBusinessId.value) {
    activeWorkers.value = []
    form.trabajadorId = ''
    return
  }

  loadingWorkers.value = true

  try {
    activeWorkers.value = await getActiveStaffByBusiness(currentBusinessId.value)

    const canKeepLegacyWorker =
      isEditing.value &&
      String(props.appointmentToEdit?.negocioId ?? '') === String(currentBusinessId.value) &&
      String(props.appointmentToEdit?.trabajadorId ?? '').trim().length > 0

    if (!activeWorkers.value.length && !canKeepLegacyWorker) {
      form.trabajadorId = ''
      return
    }

    const workerIsAvailable = activeWorkers.value.some((worker) => worker.id === form.trabajadorId)

    if (!workerIsAvailable && !canKeepLegacyWorker) {
      form.trabajadorId = ''
    }
  } catch (error) {
    console.error(error)
    activeWorkers.value = []
    form.trabajadorId = ''
  } finally {
    loadingWorkers.value = false
  }
}

const resetEditMode = () => {
  editingAppointmentId.value = ''
  emit('cancel-edit')
}

watch(
  () => props.appointmentToEdit,
  (appointment) => {
    if (!appointment?.id) {
      if (!isSubmitting.value) {
        clearForm()
        editingAppointmentId.value = ''
      }
      return
    }

    Object.assign(form, {
      clienteNombre: appointment.clienteNombre ?? '',
      telefono: appointment.telefono ?? '',
      servicio: appointment.servicio ?? '',
      fecha: appointment.fecha ?? '',
      hora: appointment.hora ?? '',
      negocioId: appointment.negocioId ?? '',
      trabajadorId: appointment.trabajadorId ?? '',
      trabajadorNombre: appointment.trabajadorNombre ?? ''
    })

    const phoneParts = splitPhoneNumber(appointment.telefono)
    countryCode.value = phoneParts.countryCode
    localPhone.value = phoneParts.localPhone

    editingAppointmentId.value = appointment.id
    message.value = { type: '', text: '' }
  },
  { immediate: true }
)

const loadOccupiedHours = async () => {
  if (!form.fecha) {
    occupiedHours.value = []
    return
  }

  try {
    occupiedHours.value = await getOccupiedHoursByDate(
      form.fecha,
      isEditing.value ? editingAppointmentId.value : '',
      currentBusinessId.value
    )
  } catch (error) {
    console.error(error)
    occupiedHours.value = []
  }
}

watch(
  () => [form.fecha, currentBusinessId.value],
  async () => {
    await loadOccupiedHours()

    if (form.hora && !availableTimeSlots.value.includes(form.hora)) {
      form.hora = ''
    }
  },
  { immediate: true }
)

watch(
  () => currentBusinessId.value,
  async () => {
    await loadWorkersByBusiness()
  },
  { immediate: true }
)

watch(
  () => form.trabajadorId,
  (workerId) => {
    const worker = workerOptions.value.find((item) => item.id === workerId)
    form.trabajadorNombre = worker?.nombre ?? ''
  }
)

watch(
  () => form.servicio,
  () => {
    if (!form.trabajadorId) return

    const canKeepLegacyWorker =
      isEditing.value &&
      String(props.appointmentToEdit?.trabajadorId ?? '') === form.trabajadorId

    if (canKeepLegacyWorker) return

    const stillEligible = eligibleWorkers.value.some(
      (worker) => worker.id === form.trabajadorId
    )

    if (!stillEligible) {
      form.trabajadorId = ''
    }
  }
)

const validateForm = () => {
  const requiredFields = [form.clienteNombre, form.servicio, form.fecha, form.hora, localPhone.value]

  if (props.mode === 'create') {
    requiredFields.push(form.negocioId)
  }

  if (hasWorkers.value) {
    requiredFields.push(form.trabajadorId)
  }

  return requiredFields.every((field) => String(field).trim().length > 0)
}

const handleSubmit = async () => {
  if (isSubmitting.value) return

  message.value = { type: '', text: '' }

  if (!validateForm()) {
    message.value = {
      type: 'error',
      text:
        props.mode === 'create'
          ? hasWorkers.value
            ? 'Por favor completa negocio, nombre, teléfono, servicio, especialista, fecha y hora antes de continuar.'
            : 'Por favor completa negocio, nombre, teléfono, servicio, fecha y hora antes de continuar.'
          : hasWorkers.value
            ? 'Por favor completa nombre, teléfono, servicio, especialista, fecha y hora antes de continuar.'
            : 'Por favor completa nombre, teléfono, servicio, fecha y hora antes de continuar.'
    }
    return
  }

  if (isDateBeforeToday(form.fecha)) {
    message.value = {
      type: 'error',
      text: 'No puedes agendar una cita en una fecha anterior a hoy'
    }
    return
  }

  if (isTimeInPastForDate(form.fecha, form.hora)) {
    message.value = {
      type: 'error',
      text: 'No puedes agendar una cita en una hora que ya pasó'
    }
    return
  }

  if (!availableTimeSlots.value.includes(form.hora)) {
    message.value = {
      type: 'error',
      text: 'Ese horario ya está ocupado'
    }
    return
  }

  const normalizedPhone = buildPhoneNumber(countryCode.value, localPhone.value)

  if (!normalizedPhone || !phoneValidation.value.isValid) {
    message.value = {
      type: 'error',
      text: phoneValidation.value.message || 'Ingresa un número de teléfono válido.'
    }
    return
  }

  isSubmitting.value = true

  try {
    const fullPayload = {
      clienteNombre: form.clienteNombre.trim(),
      telefono: normalizedPhone,
      servicio: form.servicio.trim(),
      fecha: form.fecha,
      hora: form.hora,
      negocioId: currentBusinessId.value,
      trabajadorId: form.trabajadorId,
      trabajadorNombre: selectedWorker.value?.nombre ?? ''
    }

    if (props.currentUser?.uid) {
      fullPayload.userId = props.currentUser.uid
      fullPayload.email = String(props.currentUser.email ?? '').trim().toLowerCase()
    }

    const reschedulePayload = {
      servicio: form.servicio.trim(),
      fecha: form.fecha,
      hora: form.hora,
      negocioId: currentBusinessId.value,
      trabajadorId: form.trabajadorId,
      trabajadorNombre: selectedWorker.value?.nombre ?? ''
    }

    if (isRescheduleMode.value) {
      await updateAppointment(editingAppointmentId.value, reschedulePayload)
      message.value = {
        type: 'success',
        text: 'Cita reagendada correctamente.'
      }
      emit('updated', editingAppointmentId.value)
      return
    }

    if (isEditing.value) {
      await updateAppointment(editingAppointmentId.value, fullPayload)
      message.value = {
        type: 'success',
        text: 'Cita actualizada correctamente.'
      }
      emit('updated', editingAppointmentId.value)
      clearForm()
      resetEditMode()
      return
    }

    await createAppointment(fullPayload)
    message.value = {
      type: 'success',
      text: 'Cita registrada correctamente.'
    }
    clearForm()
    emit('saved')
  } catch (error) {
    console.error(error)

    const isSlotTaken =
      error?.code === SLOT_TAKEN_ERROR || error?.message === SLOT_TAKEN_ERROR

    if (isSlotTaken) {
      message.value = {
        type: 'error',
        text: 'Ese horario ya está ocupado.'
      }
      return
    }

    message.value = {
      type: 'error',
      text: isRescheduleMode.value
        ? 'No se pudo reagendar la cita. Intenta nuevamente.'
        : isEditing.value
        ? 'No se pudo actualizar la cita. Intenta nuevamente.'
        : 'No se pudo registrar la cita. Intenta nuevamente.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleCancelEdit = () => {
  if (isSubmitting.value) return
  clearForm()
  message.value = { type: '', text: '' }
  resetEditMode()
}
</script>

<template>
  <section class="panel-card" aria-label="Formulario de citas">
    <div class="card-header">
      <h2>{{ heading }}</h2>
      <p>{{ headingDescription }}</p>
    </div>

    <form class="appointment-form" @submit.prevent="handleSubmit" novalidate>
      <div class="field-grid">
        <label class="field">
          <span>Nombre del cliente</span>
          <input
            v-model="form.clienteNombre"
            type="text"
            placeholder="Ej: Ana Martínez"
            autocomplete="name"
            :disabled="isSubmitting || lockIdentityFields"
            required
          />
        </label>

        <div class="field">
          <PhoneNumberField
            v-model:country-code="countryCode"
            v-model:local-number="localPhone"
            :disabled="isSubmitting || lockIdentityFields"
            :required="true"
            label="Teléfono"
            placeholder="Ej: 3105622260"
            :error-message="phoneErrorMessage"
            :helper="phoneHelperMessage"
          />
        </div>

        <label v-if="props.mode === 'create'" class="field field-full">
          <span>Negocio</span>
          <select v-model="form.negocioId" :disabled="isSubmitting || loadingBusinesses" required>
            <option value="" disabled>Selecciona un negocio</option>
            <option v-for="business in businesses" :key="business.id" :value="business.id">
              {{ business.nombre }}
            </option>
          </select>
        </label>

        <label class="field field-full">
          <span>Servicio</span>
          <input
            v-model="form.servicio"
            list="servicios"
            type="text"
            placeholder="Selecciona o escribe un servicio"
            :disabled="isSubmitting"
            required
          />
          <datalist id="servicios">
            <option v-for="service in serviceOptions" :key="service" :value="service" />
          </datalist>
        </label>

        <div class="field field-full">
          <WorkerSelect
            v-model="form.trabajadorId"
            :workers="workerOptions"
            :loading="loadingWorkers"
            :disabled="isSubmitting || !currentBusinessId"
            :required="hasWorkers"
            :empty-label="workerEmptyLabel"
            :empty-message="workerEmptyMessage"
          />
        </div>

        <label class="field">
          <span>Fecha</span>
          <input
            v-model="form.fecha"
            type="date"
            :min="minDate"
            :disabled="isSubmitting"
            required
          />
        </label>

        <label class="field">
          <span>Hora</span>
          <select
            v-model="form.hora"
            :disabled="isSubmitting"
            required
          >
            <option value="" disabled>Selecciona una hora</option>
            <option v-for="slot in availableTimeSlots" :key="slot" :value="slot">
              {{ slot }}
            </option>
          </select>
          <small v-if="form.fecha && !availableTimeSlots.length" class="slot-helper">
            No hay horarios disponibles para la fecha seleccionada.
          </small>
        </label>
      </div>

      <button class="btn btn-primary" type="submit" :disabled="isSubmitting">
        {{
          isSubmitting
            ? isRescheduleMode
              ? 'Guardando reagendamiento...'
              : isEditing
              ? 'Guardando cambios...'
              : 'Registrando cita...'
            : isRescheduleMode
              ? 'Guardar reagendamiento'
              : isEditing
              ? 'Guardar cambios'
              : 'Registrar cita'
        }}
      </button>

      <button
        v-if="isEditing"
        class="btn btn-secondary"
        type="button"
        :disabled="isSubmitting"
        @click="handleCancelEdit"
      >
        {{ isRescheduleMode ? 'Cancelar reagendamiento' : 'Cancelar edición' }}
      </button>

      <p v-if="message.text" :class="['feedback-message', message.type]">
        {{ message.text }}
      </p>
    </form>
  </section>
</template>

<style scoped>
.card-header {
  margin-bottom: 1rem;
}

.card-header h2 {
  margin: 0;
  color: var(--primary);
}

.card-header p {
  margin: 0.5rem 0 0;
  color: #4f6a45;
}

.appointment-form {
  display: grid;
  gap: 0.8rem;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field span {
  font-weight: 600;
  color: var(--text-dark);
}

.field input {
  width: 100%;
  border: 1px solid #c7dfd3;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background-color: #fcfffd;
  color: var(--text-dark);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field select {
  width: 100%;
  border: 1px solid #c7dfd3;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background-color: #fcfffd;
  color: var(--text-dark);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 103, 71, 0.12);
  outline: none;
}

.field select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 103, 71, 0.12);
  outline: none;
}

.slot-helper {
  color: #6b855f;
  font-weight: 600;
  font-size: 0.82rem;
}

.feedback-message {
  margin: 0.15rem 0 0;
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

@media (min-width: 768px) {
  .field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field-full {
    grid-column: 1 / -1;
  }
}
</style>
