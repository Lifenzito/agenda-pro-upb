<script setup>
const props = defineProps({
  appointments: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  processingId: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  },
  successMessage: {
    type: String,
    default: ''
  },
  showEdit: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: true
  },
  editLabel: {
    type: String,
    default: 'Editar'
  },
  cancelLabel: {
    type: String,
    default: 'Cancelar'
  }
})

const emit = defineEmits(['edit', 'cancel'])

const formatDate = (dateValue) => {
  if (!dateValue) return '-'

  const parsedDate = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) return dateValue

  return parsedDate.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const resolveWorkerName = (appointment) => {
  const workerName = String(appointment?.trabajadorNombre ?? '').trim()
  return workerName || 'Sin asignar'
}
</script>

<template>
  <section class="panel-card" aria-label="Listado de citas">
    <div class="card-header">
      <h2>Gestionar citas</h2>
      <p>Consulta la agenda y ejecuta acciones según tu perfil.</p>
    </div>

    <p v-if="errorMessage" class="feedback-message error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="feedback-message success">{{ successMessage }}</p>

    <div class="table-wrapper">
      <table class="appointments-table" role="table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Servicio</th>
            <th>Especialista</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="empty-state">Cargando citas...</td>
          </tr>
          <tr v-else-if="!appointments.length">
            <td colspan="7" class="empty-state">No hay citas registradas por ahora.</td>
          </tr>
          <tr v-for="appointment in appointments" :key="appointment.id">
            <td>{{ appointment.clienteNombre }}</td>
            <td>{{ appointment.telefono }}</td>
            <td>{{ appointment.servicio }}</td>
            <td>{{ resolveWorkerName(appointment) }}</td>
            <td>{{ formatDate(appointment.fecha) }}</td>
            <td>{{ appointment.hora }}</td>
            <td>
              <div class="row-actions">
                <button
                  v-if="showEdit"
                  class="btn btn-secondary btn-table"
                  type="button"
                  :disabled="processingId === appointment.id"
                  @click="emit('edit', appointment)"
                >
                  {{ editLabel }}
                </button>

                <button
                  v-if="showDelete"
                  class="btn btn-danger btn-table"
                  type="button"
                  :disabled="processingId === appointment.id"
                  @click="emit('cancel', appointment)"
                >
                  {{ processingId === appointment.id ? 'Procesando...' : cancelLabel }}
                </button>
              </div>
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
  margin: 0.45rem 0 0;
  color: #4f6a45;
}

.table-wrapper {
  border: 1px solid #d5ecdf;
  border-radius: 14px;
  overflow: auto;
}

.appointments-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.appointments-table th,
.appointments-table td {
  text-align: left;
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid #edf5f0;
  vertical-align: middle;
}

.appointments-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--primary);
  background-color: #f2fdf7;
}

.appointments-table tr:hover td {
  background-color: #f9fffc;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-table {
  min-width: 88px;
  padding: 0.45rem 0.7rem;
  font-size: 0.87rem;
}

.empty-state {
  text-align: center;
  font-weight: 600;
  color: #57734d;
  padding: 1.2rem;
}

.feedback-message {
  margin: 0 0 0.75rem;
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
