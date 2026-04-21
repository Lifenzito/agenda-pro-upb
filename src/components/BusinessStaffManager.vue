<script setup>
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
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
  }
})

const initialFormState = () => ({
  nombre: '',
  especialidad: '',
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
      setFeedback('error', 'No se pudo cargar la lista de trabajadores.')
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

const startEdit = (worker) => {
  editingId.value = worker.id
  form.nombre = worker.nombre ?? ''
  form.especialidad = worker.especialidad ?? ''
  form.activo = worker.activo !== false
  clearFeedback()
}

const cancelEdit = () => {
  resetForm()
  clearFeedback()
}

const handleSubmit = async () => {
  if (isSubmitting.value || !props.businessId) return

  if (!String(form.nombre ?? '').trim() || !String(form.especialidad ?? '').trim()) {
    setFeedback('error', 'Nombre y especialidad son obligatorios.')
    return
  }

  isSubmitting.value = true
  clearFeedback()

  try {
    const payload = {
      nombre: form.nombre,
      especialidad: form.especialidad,
      activo: form.activo,
      negocioId: props.businessId
    }

    if (isEditing.value) {
      await updateStaffMember(editingId.value, payload)
      setFeedback('success', 'Trabajador actualizado correctamente.')
    } else {
      await createStaffMember(payload)
      setFeedback('success', 'Trabajador agregado correctamente.')
    }

    resetForm()
  } catch (error) {
    console.error(error)
    setFeedback(
      'error',
      isEditing.value
        ? 'No se pudo actualizar el trabajador.'
        : 'No se pudo agregar el trabajador.'
    )
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

    setFeedback('success', worker.activo ? 'Trabajador desactivado.' : 'Trabajador activado.')
  } catch (error) {
    console.error(error)
    setFeedback('error', 'No se pudo cambiar el estado del trabajador.')
  } finally {
    processingId.value = ''
  }
}

const handleDelete = async (worker) => {
  if (!worker?.id || processingId.value) return

  const accepted = window.confirm(
    `¿Seguro que deseas eliminar a ${worker.nombre} de la lista de trabajadores?`
  )

  if (!accepted) return

  processingId.value = worker.id
  clearFeedback()

  try {
    await deleteStaffMember(worker.id)

    if (editingId.value === worker.id) {
      cancelEdit()
    }

    setFeedback('success', 'Trabajador eliminado correctamente.')
  } catch (error) {
    console.error(error)
    setFeedback('error', 'No se pudo eliminar el trabajador.')
  } finally {
    processingId.value = ''
  }
}
</script>

<template>
  <section class="panel-card" aria-label="Gestión de trabajadores">
    <div class="card-header">
      <h2>Trabajadores del negocio</h2>
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
          <span>Especialidad</span>
          <input
            v-model="form.especialidad"
            type="text"
            placeholder="Ej: Corte de cabello"
            :disabled="isSubmitting || !businessId"
            required
          />
        </label>

        <label class="field checkbox-field">
          <input v-model="form.activo" type="checkbox" :disabled="isSubmitting || !businessId" />
          <span>Trabajador activo</span>
        </label>
      </div>

      <div class="actions-row">
        <button class="btn btn-primary" type="submit" :disabled="isSubmitting || !businessId">
          {{
            isSubmitting
              ? isEditing
                ? 'Guardando...'
                : 'Agregando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Agregar trabajador'
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
      <p v-if="loading" class="empty-state">Cargando trabajadores...</p>
      <p v-else-if="!staffList.length" class="empty-state">
        Aún no hay trabajadores registrados para este negocio.
      </p>

      <table v-else class="staff-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Especialidad</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="worker in staffList" :key="worker.id">
            <td>{{ worker.nombre }}</td>
            <td>{{ worker.especialidad || 'Sin especialidad' }}</td>
            <td>
              <span :class="['status-pill', worker.activo ? 'active' : 'inactive']">
                {{ worker.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="row-actions">
              <button
                class="btn btn-secondary"
                type="button"
                :disabled="processingId === worker.id || isSubmitting"
                @click="startEdit(worker)"
              >
                Editar
              </button>

              <button
                class="btn btn-secondary"
                type="button"
                :disabled="processingId === worker.id || isSubmitting"
                @click="handleToggleActive(worker)"
              >
                {{ worker.activo ? 'Desactivar' : 'Activar' }}
              </button>

              <button
                class="btn btn-danger"
                type="button"
                :disabled="processingId === worker.id || isSubmitting"
                @click="handleDelete(worker)"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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

.field span {
  font-weight: 600;
  color: var(--text-dark);
}

.field input {
  border: 1px solid #c7dfd3;
  border-radius: 12px;
  padding: 0.75rem 0.85rem;
  background: #fcfffd;
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

.staff-table {
  width: 100%;
  border-collapse: collapse;
}

.staff-table th,
.staff-table td {
  text-align: left;
  padding: 0.7rem;
  border-bottom: 1px solid #e0eee7;
}

.row-actions {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.status-pill {
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.status-pill.active {
  background: rgba(30, 125, 50, 0.12);
  color: #1e7d32;
}

.status-pill.inactive {
  background: rgba(179, 38, 30, 0.12);
  color: #b3261e;
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
