<script setup>
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
import WorkerCard from './WorkerCard.vue'
import {
  createStaffMember,
  deleteStaffMember,
  subscribeStaffByBusiness,
  updateStaffMember
} from '../services/staffService'

const props = defineProps({
  businessId: {
    type: String,
    default: ''
  },
  businessServices: {
    type: Array,
    default: () => []
  }
})

const initialFormState = () => ({
  nombre: '',
  rol: '',
  descripcion: '',
  serviciosAsignados: [],
  activo: true
})

const staffList = ref([])
const loading = ref(true)
const isSubmitting = ref(false)
const processingId = ref('')
const editingId = ref('')
const feedback = ref({ type: '', text: '' })
const form = reactive(initialFormState())

let unsubscribeStaff = () => {}
let feedbackTimeout = null

const isEditing = computed(() => Boolean(editingId.value))

const availableServices = computed(() => {
  if (!Array.isArray(props.businessServices)) return []

  const seen = new Set()
  const services = []

  props.businessServices.forEach((service) => {
    const cleaned = String(service ?? '').trim()
    if (!cleaned) return
    const key = cleaned.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    services.push(cleaned)
  })

  return services
})

const clearFeedback = () => {
  feedback.value = { type: '', text: '' }
}

const setFeedback = (type, text) => {
  feedback.value = { type, text }
  clearTimeout(feedbackTimeout)
  feedbackTimeout = setTimeout(() => {
    clearFeedback()
  }, 3000)
}

const resetForm = () => {
  Object.assign(form, initialFormState())
  editingId.value = ''
}

const subscribeToStaff = () => {
  unsubscribeStaff()

  if (!props.businessId) {
    loading.value = false
    staffList.value = []
    return
  }

  loading.value = true

  unsubscribeStaff = subscribeStaffByBusiness(
    props.businessId,
    (data) => {
      staffList.value = data
      loading.value = false
    },
    () => {
      loading.value = false
      setFeedback('error', 'No se pudo cargar la lista de especialistas.')
    }
  )
}

watch(
  () => props.businessId,
  () => {
    subscribeToStaff()
    resetForm()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  unsubscribeStaff()
  clearTimeout(feedbackTimeout)
})

const toggleService = (service) => {
  const cleaned = String(service ?? '').trim()
  if (!cleaned) return

  const lower = cleaned.toLowerCase()
  const index = form.serviciosAsignados.findIndex(
    (item) => String(item ?? '').trim().toLowerCase() === lower
  )

  if (index >= 0) {
    form.serviciosAsignados.splice(index, 1)
  } else {
    form.serviciosAsignados.push(cleaned)
  }
}

const isServiceSelected = (service) => {
  const lower = String(service ?? '').trim().toLowerCase()
  if (!lower) return false

  return form.serviciosAsignados.some(
    (item) => String(item ?? '').trim().toLowerCase() === lower
  )
}

const startEdit = (worker) => {
  editingId.value = worker.id
  form.nombre = worker.nombre ?? ''
  form.rol = worker.rol ?? worker.especialidad ?? ''
  form.descripcion = worker.descripcion ?? ''
  form.serviciosAsignados = Array.isArray(worker.serviciosAsignados)
    ? [...worker.serviciosAsignados]
    : []
  form.activo = worker.activo !== false
  clearFeedback()
}

const cancelEdit = () => {
  resetForm()
  clearFeedback()
}

const handleSubmit = async () => {
  if (isSubmitting.value || !props.businessId) return

  const cleanName = String(form.nombre ?? '').trim()
  const cleanRole = String(form.rol ?? '').trim()
  const cleanServices = form.serviciosAsignados
    .map((service) => String(service ?? '').trim())
    .filter(Boolean)

  if (!cleanName) {
    setFeedback('error', 'El nombre del especialista es obligatorio.')
    return
  }

  if (!cleanRole) {
    setFeedback('error', 'Indica el rol del especialista (ej: Barbero, Estilista).')
    return
  }

  if (!cleanServices.length) {
    setFeedback('error', 'Selecciona al menos un servicio que ofrezca este especialista.')
    return
  }

  isSubmitting.value = true
  clearFeedback()

  try {
    const payload = {
      nombre: cleanName,
      rol: cleanRole,
      descripcion: String(form.descripcion ?? '').trim(),
      serviciosAsignados: cleanServices,
      activo: Boolean(form.activo),
      negocioId: props.businessId
    }

    if (isEditing.value) {
      await updateStaffMember(editingId.value, payload)
      setFeedback('success', 'Especialista actualizado correctamente.')
    } else {
      await createStaffMember(payload)
      setFeedback('success', 'Especialista agregado correctamente.')
    }

    resetForm()
  } catch (error) {
    console.error(error)

    if (error?.code === 'duplicate_staff') {
      setFeedback('error', 'Ya existe un especialista con el mismo nombre y rol en este negocio.')
    } else {
      setFeedback(
        'error',
        isEditing.value
          ? 'No se pudo actualizar el especialista.'
          : 'No se pudo agregar el especialista.'
      )
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleToggleActive = async (worker) => {
  if (!worker?.id || processingId.value) return

  processingId.value = worker.id
  clearFeedback()

  try {
    await updateStaffMember(worker.id, {
      activo: !worker.activo,
      negocioId: props.businessId
    })

    setFeedback('success', worker.activo ? 'Especialista desactivado.' : 'Especialista activado.')
  } catch (error) {
    console.error(error)
    setFeedback('error', 'No se pudo cambiar el estado del especialista.')
  } finally {
    processingId.value = ''
  }
}

const handleDelete = async (worker) => {
  if (!worker?.id || processingId.value) return

  const accepted = window.confirm(
    `¿Seguro que deseas eliminar a ${worker.nombre} de la lista de especialistas?`
  )

  if (!accepted) return

  processingId.value = worker.id
  clearFeedback()

  try {
    await deleteStaffMember(worker.id)

    if (editingId.value === worker.id) {
      cancelEdit()
    }

    setFeedback('success', 'Especialista eliminado correctamente.')
  } catch (error) {
    console.error(error)
    setFeedback('error', 'No se pudo eliminar el especialista.')
  } finally {
    processingId.value = ''
  }
}
</script>

<template>
  <section class="panel-card" aria-label="Gestión de especialistas">
    <div class="card-header">
      <h2>Especialistas del negocio</h2>
      <p>Agrega y administra el equipo que atenderá las citas de tus clientes.</p>
    </div>

    <p v-if="feedback.text" :class="['feedback-message', feedback.type]">
      {{ feedback.text }}
    </p>

    <form class="staff-form" @submit.prevent="handleSubmit" novalidate>
      <div class="staff-form-grid">
        <label class="field">
          <span>Nombre</span>
          <input
            v-model="form.nombre"
            type="text"
            placeholder="Ej: Andrés Ramírez"
            :disabled="isSubmitting || !businessId"
            required
          />
        </label>

        <label class="field">
          <span>Rol</span>
          <input
            v-model="form.rol"
            type="text"
            placeholder="Ej: Barbero, Estilista"
            :disabled="isSubmitting || !businessId"
            required
          />
        </label>

        <label class="field checkbox-field">
          <input v-model="form.activo" type="checkbox" :disabled="isSubmitting || !businessId" />
          <span>Especialista activo</span>
        </label>
      </div>

      <label class="field field-full">
        <span>Descripción</span>
        <textarea
          v-model="form.descripcion"
          rows="2"
          placeholder="Describe la experiencia o estilo del especialista (opcional)."
          :disabled="isSubmitting || !businessId"
        ></textarea>
      </label>

      <fieldset class="services-field" :disabled="isSubmitting || !businessId">
        <legend>Servicios que ofrece</legend>

        <p v-if="!availableServices.length" class="services-empty">
          Este negocio aún no tiene servicios configurados. Agrega servicios en
          <strong>Información del negocio</strong> para poder asignarlos a los especialistas.
        </p>

        <div v-else class="services-grid">
          <label
            v-for="service in availableServices"
            :key="service"
            class="service-option"
          >
            <input
              type="checkbox"
              :value="service"
              :checked="isServiceSelected(service)"
              @change="toggleService(service)"
            />
            <span>{{ service }}</span>
          </label>
        </div>
      </fieldset>

      <div class="actions-row">
        <button
          class="btn btn-primary"
          type="submit"
          :disabled="isSubmitting || !businessId || !availableServices.length"
        >
          {{
            isSubmitting
              ? isEditing
                ? 'Guardando...'
                : 'Agregando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Agregar especialista'
          }}
        </button>

        <button
          v-if="isEditing"
          class="btn btn-secondary"
          type="button"
          :disabled="isSubmitting"
          @click="cancelEdit"
        >
          Cancelar edición
        </button>
      </div>
    </form>

    <div class="list-wrapper">
      <p v-if="loading" class="empty-state">Cargando especialistas...</p>
      <p v-else-if="!staffList.length" class="empty-state">
        Aún no hay especialistas registrados para este negocio.
      </p>

      <div v-else class="worker-grid">
        <WorkerCard
          v-for="worker in staffList"
          :key="worker.id"
          :worker="worker"
          :processing="processingId === worker.id"
          :disabled="isSubmitting"
          @edit="startEdit"
          @toggle-active="handleToggleActive"
          @delete="handleDelete"
        />
      </div>
    </div>
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
  margin: 0.4rem 0 0;
  color: #4f6a45;
}

.staff-form {
  display: grid;
  gap: 0.9rem;
}

.staff-form-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-full {
  grid-column: 1 / -1;
}

.field span {
  font-weight: 600;
  color: var(--text-dark);
}

.field input,
.field textarea {
  border: 1px solid #c7dfd3;
  border-radius: 12px;
  padding: 0.75rem 0.85rem;
  background: #fcfffd;
  color: var(--text-dark);
  font-family: inherit;
}

.field textarea {
  resize: vertical;
  min-height: 64px;
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 0.55rem;
}

.checkbox-field input {
  width: 18px;
  height: 18px;
}

.services-field {
  border: 1px solid #d9ecdf;
  border-radius: 12px;
  padding: 0.75rem 0.85rem;
  display: grid;
  gap: 0.6rem;
}

.services-field legend {
  font-weight: 700;
  color: var(--text-dark);
  padding: 0 0.35rem;
}

.services-empty {
  margin: 0;
  color: #8b6e1e;
  font-weight: 600;
  font-size: 0.9rem;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.45rem 0.9rem;
}

.service-option {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--text-dark);
  font-weight: 500;
}

.service-option input {
  width: 16px;
  height: 16px;
}

.actions-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.list-wrapper {
  margin-top: 1rem;
}

.empty-state {
  margin: 0;
  color: #557148;
}

.worker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.9rem;
}

.feedback-message {
  margin: 0 0 0.8rem;
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

@media (max-width: 820px) {
  .staff-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
