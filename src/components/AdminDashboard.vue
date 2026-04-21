<script setup>
import { computed } from 'vue'

const props = defineProps({
  appointments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['go-manage'])

const getDateTime = (appointment) => {
  if (!appointment?.fecha || !appointment?.hora) return null

  const parsedDate = new Date(`${appointment.fecha}T${appointment.hora}:00`)

  if (Number.isNaN(parsedDate.getTime())) return null

  return parsedDate
}

const formatDate = (dateValue) => {
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

const metrics = computed(() => {
  const now = new Date()
  const todayString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)

  const total = props.appointments.length

  const todayCount = props.appointments.filter((appointment) => appointment.fecha === todayString).length

  const futureAppointments = props.appointments
    .map((appointment) => ({
      ...appointment,
      dateTime: getDateTime(appointment)
    }))
    .filter((appointment) => appointment.dateTime && appointment.dateTime.getTime() > now.getTime())
    .sort((a, b) => a.dateTime - b.dateTime)

  const nextAppointment = futureAppointments[0] ?? null
  const upcomingThree = futureAppointments.slice(0, 3)

  return {
    total,
    todayCount,
    futureCount: futureAppointments.length,
    nextAppointment,
    upcomingThree
  }
})
</script>

<template>
  <section class="dashboard-grid">
    <article class="panel-card metric-card">
      <p class="label">Total de citas registradas</p>
      <strong>{{ metrics.total }}</strong>
    </article>

    <article class="panel-card metric-card">
      <p class="label">Citas de hoy</p>
      <strong>{{ metrics.todayCount }}</strong>
    </article>

    <article class="panel-card metric-card">
      <p class="label">Próxima cita</p>
      <template v-if="metrics.nextAppointment">
        <strong>
          {{ formatDate(metrics.nextAppointment.fecha) }} · {{ metrics.nextAppointment.hora }}
        </strong>
        <small>{{ metrics.nextAppointment.clienteNombre }}</small>
      </template>
      <template v-else>
        <strong>—</strong>
        <small>No hay próximas citas programadas</small>
      </template>
    </article>

    <article class="panel-card metric-card">
      <p class="label">Citas futuras</p>
      <strong>{{ metrics.futureCount }}</strong>
    </article>

    <article class="panel-card summary-card">
      <div class="summary-head">
        <h3>Próximas citas</h3>
        <button class="btn btn-secondary" type="button" @click="emit('go-manage')">
          Ir a gestionar citas
        </button>
      </div>

      <ul v-if="metrics.upcomingThree.length" class="upcoming-list">
        <li v-for="appointment in metrics.upcomingThree" :key="appointment.id">
          <span>{{ formatDate(appointment.fecha) }} · {{ appointment.hora }}</span>
          <strong>{{ appointment.clienteNombre }}</strong>
          <small>{{ appointment.servicio }} · {{ resolveWorkerName(appointment) }}</small>
        </li>
      </ul>

      <p v-else class="empty">No hay citas próximas para mostrar.</p>
    </article>
  </section>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.metric-card {
  display: grid;
  gap: 0.35rem;
}

.metric-card .label {
  margin: 0;
  color: #5f7d53;
  font-weight: 600;
}

.metric-card strong {
  color: var(--primary);
  font-size: 1.5rem;
  line-height: 1.15;
}

.metric-card small {
  color: #6a855f;
}

.summary-card {
  grid-column: 1 / -1;
  display: grid;
  gap: 0.9rem;
}

.summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.summary-head h3 {
  margin: 0;
  color: var(--primary);
}

.upcoming-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.6rem;
}

.upcoming-list li {
  border: 1px solid #dbede2;
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  display: grid;
  gap: 0.12rem;
  background: #fbfffd;
}

.upcoming-list li span {
  color: #5d7b53;
  font-size: 0.88rem;
}

.upcoming-list li strong {
  color: #274a1c;
}

.upcoming-list li small {
  color: #67845c;
}

.empty {
  margin: 0;
  color: #67845c;
  font-weight: 600;
}

@media (max-width: 980px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .summary-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
