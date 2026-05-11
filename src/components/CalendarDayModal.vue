<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  date: {
    type: String,
    required: true
  },
  appointments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const formattedDate = computed(() => {
  const parts = String(props.date).split('-')
  if (parts.length !== 3) return props.date

  const [year, month, day] = parts.map((part) => Number(part))
  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) return props.date

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const sortedAppointments = computed(() =>
  [...props.appointments].sort((a, b) =>
    String(a?.hora ?? '').localeCompare(String(b?.hora ?? ''))
  )
)

const handleClose = () => {
  emit('close')
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}

const stateLabel = (state) => {
  const value = String(state ?? '').trim()
  return value || ''
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="modal-backdrop" role="dialog" aria-modal="true" @click.self="handleClose">
    <div class="modal-card panel-card">
      <header class="modal-header">
        <div>
          <p class="eyebrow">Citas del día</p>
          <h3>{{ formattedDate }}</h3>
        </div>
        <button class="close-btn" type="button" aria-label="Cerrar" @click="handleClose">
          ×
        </button>
      </header>

      <p v-if="!sortedAppointments.length" class="empty">
        No hay citas registradas para esta fecha.
      </p>

      <ul v-else class="appointment-list">
        <li v-for="appointment in sortedAppointments" :key="appointment.id" class="item">
          <div class="time-block">
            <span class="time">{{ appointment.hora || '—' }}</span>
          </div>
          <div class="info">
            <p class="primary">{{ appointment.clienteNombre || 'Cliente sin nombre' }}</p>
            <p class="secondary">
              {{ appointment.servicio || 'Servicio sin especificar' }}
              <span v-if="appointment.trabajadorNombre">
                · {{ appointment.trabajadorNombre }}
              </span>
              <span v-else>· Sin asignar</span>
            </p>
            <p v-if="appointment.telefono" class="meta">Tel: {{ appointment.telefono }}</p>
            <p v-if="stateLabel(appointment.estado)" class="state">
              {{ stateLabel(appointment.estado) }}
            </p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 36, 24, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.modal-card {
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  overflow-y: auto;
  display: grid;
  gap: 1rem;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.modal-header h3 {
  margin: 0.15rem 0 0;
  color: var(--primary);
  font-size: 1.2rem;
  text-transform: capitalize;
}

.eyebrow {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #5d7a53;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  border: 1px solid #d9ecdf;
  border-radius: 10px;
  width: 34px;
  height: 34px;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--primary);
}

.close-btn:hover {
  background-color: #f1faf3;
}

.empty {
  margin: 0;
  color: #5d7a53;
  font-size: 0.95rem;
}

.appointment-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.item {
  display: flex;
  gap: 0.75rem;
  border: 1px solid #d9ecdf;
  border-radius: 12px;
  padding: 0.75rem;
  background-color: #fff;
}

.time-block {
  flex-shrink: 0;
  min-width: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.5rem;
  border-radius: 10px;
  background-color: #e9f7ef;
  color: #006747;
  font-weight: 700;
}

.info {
  flex: 1;
  display: grid;
  gap: 0.15rem;
}

.info .primary {
  margin: 0;
  color: var(--text-dark);
  font-weight: 700;
}

.info .secondary {
  margin: 0;
  color: #4f6a45;
  font-size: 0.9rem;
}

.info .meta,
.info .state {
  margin: 0;
  color: #5d7a53;
  font-size: 0.82rem;
}

.info .state {
  text-transform: capitalize;
  font-weight: 600;
}
</style>
