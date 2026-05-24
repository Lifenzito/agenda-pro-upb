<script setup>
/**
 * Vista de citas agrupadas por especialista.
 * Muestra solo citas futuras por cada trabajador; las pasadas se ocultan automáticamente.
 */
import { computed } from 'vue'

const props = defineProps({
  appointments: {
    type: Array,
    default: () => []
  },
  workers: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const now = computed(() => new Date())

const isFutureAppointment = (appointment) => {
  if (!appointment?.fecha || !appointment?.hora) return false

  const appointmentDate = new Date(`${appointment.fecha}T${appointment.hora}:00`)
  return !Number.isNaN(appointmentDate.getTime()) && appointmentDate.getTime() > now.value.getTime()
}

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

const staffWithAppointments = computed(() => {
  const futureAppointments = props.appointments.filter(isFutureAppointment)

  return props.workers.map((worker) => {
    const workerId = String(worker.id ?? '').trim()
    const workerName = String(worker.nombre ?? '').trim()

    const workerAppointments = futureAppointments
      .filter((appointment) => {
        const appointmentWorkerId = String(appointment.trabajadorId ?? '').trim()
        const appointmentWorkerName = String(appointment.trabajadorNombre ?? '').trim()
        return appointmentWorkerId === workerId || appointmentWorkerName === workerName
      })
      .sort((a, b) => {
        const first = `${a.fecha ?? ''} ${a.hora ?? ''}`
        const second = `${b.fecha ?? ''} ${b.hora ?? ''}`
        return first.localeCompare(second)
      })

    return {
      ...worker,
      appointments: workerAppointments
    }
  })
})

const totalFutureAppointments = computed(() =>
  staffWithAppointments.value.reduce((sum, worker) => sum + worker.appointments.length, 0)
)
</script>

<template>
  <section class="staff-appointments" aria-label="Citas por especialista">
    <div v-if="loading" class="panel-card status-card">
      <p>Cargando citas por especialista...</p>
    </div>

    <template v-else>
      <div class="panel-card summary-pill">
        <strong>{{ totalFutureAppointments }}</strong>
        <span>citas futuras asignadas a especialistas</span>
      </div>

      <div v-if="!workers.length" class="panel-card status-card">
        <p>No hay especialistas registrados en el negocio.</p>
      </div>

      <article
        v-for="worker in staffWithAppointments"
        :key="worker.id"
        class="panel-card worker-section"
      >
        <header class="worker-header">
          <div class="worker-info">
            <h3>{{ worker.nombre }}</h3>
            <span v-if="worker.rol" class="worker-role">{{ worker.rol }}</span>
          </div>
          <span class="badge">
            {{ worker.appointments.length }} cita{{ worker.appointments.length !== 1 ? 's' : '' }}
          </span>
        </header>

        <div v-if="worker.appointments.length" class="table-wrapper">
          <table class="appointments-table" role="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="appointment in worker.appointments" :key="appointment.id">
                <td>{{ appointment.clienteNombre }}</td>
                <td>{{ appointment.servicio }}</td>
                <td>{{ formatDate(appointment.fecha) }}</td>
                <td>{{ appointment.hora }}</td>
                <td>{{ appointment.telefono || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-else class="empty">No tiene citas futuras programadas.</p>
      </article>
    </template>
  </section>
</template>

<style scoped>
.staff-appointments {
  display: grid;
  gap: 1rem;
}

.status-card {
  text-align: center;
  padding: 1.5rem;
}

.status-card p {
  margin: 0;
  color: #5d7a53;
  font-weight: 600;
}

.summary-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

.summary-pill strong {
  color: var(--primary);
  font-size: 1.4rem;
}

.summary-pill span {
  color: #4f6a45;
  font-weight: 600;
}

.worker-section {
  display: grid;
  gap: 0.75rem;
}

.worker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.worker-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.worker-info h3 {
  margin: 0;
  color: var(--primary);
  font-size: 1.1rem;
}

.worker-role {
  background-color: #e9f7ef;
  color: #006747;
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.badge {
  background-color: #f1f8f2;
  border: 1px solid #c7dfd3;
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary);
}

.table-wrapper {
  border: 1px solid #d5ecdf;
  border-radius: 14px;
  overflow: auto;
}

.appointments-table {
  width: 100%;
  min-width: 580px;
  border-collapse: collapse;
}

.appointments-table th,
.appointments-table td {
  text-align: left;
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #edf5f0;
  vertical-align: middle;
}

.appointments-table th {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--primary);
  background-color: #f2fdf7;
}

.appointments-table tr:hover td {
  background-color: #f9fffc;
}

.empty {
  margin: 0;
  color: #67845c;
  font-weight: 600;
  font-size: 0.92rem;
}
</style>
