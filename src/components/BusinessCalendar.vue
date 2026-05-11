<script setup>
import { computed, ref } from 'vue'
import CalendarDayModal from './CalendarDayModal.vue'

const props = defineProps({
  appointments: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
]

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const today = new Date()
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref('')

const toIsoDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const todayIso = toIsoDate(today)

const monthLabel = computed(
  () => `${MONTH_NAMES[cursor.value.getMonth()]} ${cursor.value.getFullYear()}`
)

const appointmentsByDate = computed(() => {
  const map = new Map()

  props.appointments.forEach((appointment) => {
    const key = String(appointment?.fecha ?? '').trim()
    if (!key) return
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(appointment)
  })

  map.forEach((list) => {
    list.sort((a, b) => String(a?.hora ?? '').localeCompare(String(b?.hora ?? '')))
  })

  return map
})

const calendarCells = computed(() => {
  const year = cursor.value.getFullYear()
  const month = cursor.value.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  // Lunes = 0 ... Domingo = 6
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ key: `pad-start-${i}`, blank: true })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    const iso = toIsoDate(date)
    const dayAppointments = appointmentsByDate.value.get(iso) ?? []

    cells.push({
      key: iso,
      iso,
      day,
      count: dayAppointments.length,
      isToday: iso === todayIso
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `pad-end-${cells.length}`, blank: true })
  }

  return cells
})

const selectedAppointments = computed(() => {
  if (!selectedDate.value) return []
  return appointmentsByDate.value.get(selectedDate.value) ?? []
})

const goPreviousMonth = () => {
  const next = new Date(cursor.value)
  next.setMonth(next.getMonth() - 1)
  cursor.value = next
}

const goNextMonth = () => {
  const next = new Date(cursor.value)
  next.setMonth(next.getMonth() + 1)
  cursor.value = next
}

const goToday = () => {
  const now = new Date()
  cursor.value = new Date(now.getFullYear(), now.getMonth(), 1)
}

const handleSelectDay = (cell) => {
  if (cell.blank) return
  selectedDate.value = cell.iso
}

const closeModal = () => {
  selectedDate.value = ''
}
</script>

<template>
  <section class="calendar-card panel-card">
    <header class="calendar-header">
      <div>
        <h2>{{ monthLabel }}</h2>
        <p>Vista mensual de todas las citas del negocio.</p>
      </div>

      <div class="calendar-controls">
        <button type="button" class="nav-btn" @click="goPreviousMonth" aria-label="Mes anterior">
          ‹
        </button>
        <button type="button" class="today-btn" @click="goToday">Hoy</button>
        <button type="button" class="nav-btn" @click="goNextMonth" aria-label="Mes siguiente">
          ›
        </button>
      </div>
    </header>

    <p v-if="props.loading" class="loading">Cargando citas…</p>

    <div class="weekday-row" aria-hidden="true">
      <span v-for="day in WEEKDAYS" :key="day">{{ day }}</span>
    </div>

    <div class="calendar-grid">
      <template v-for="cell in calendarCells" :key="cell.key">
        <div v-if="cell.blank" class="day-cell blank" />
        <button
          v-else
          type="button"
          class="day-cell"
          :class="{ today: cell.isToday, 'has-events': cell.count > 0 }"
          @click="handleSelectDay(cell)"
        >
          <span class="day-number">{{ cell.day }}</span>
          <span v-if="cell.count" class="badge" :title="`${cell.count} citas`">
            {{ cell.count }}
          </span>
        </button>
      </template>
    </div>

    <CalendarDayModal
      v-if="selectedDate"
      :date="selectedDate"
      :appointments="selectedAppointments"
      @close="closeModal"
    />
  </section>
</template>

<style scoped>
.calendar-card {
  display: grid;
  gap: 1rem;
}

.calendar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.calendar-header h2 {
  margin: 0;
  color: var(--primary);
  font-size: 1.25rem;
  text-transform: capitalize;
}

.calendar-header p {
  margin: 0.25rem 0 0;
  color: #5d7a53;
  font-size: 0.9rem;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-btn,
.today-btn {
  border: 1px solid #d9ecdf;
  background-color: #fff;
  color: var(--primary);
  border-radius: 10px;
  padding: 0.4rem 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.nav-btn:hover,
.today-btn:hover {
  background-color: #f1faf3;
  border-color: var(--primary);
}

.loading {
  margin: 0;
  color: #5d7a53;
  font-size: 0.9rem;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  color: #5d7a53;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.weekday-row span {
  text-align: center;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.day-cell {
  position: relative;
  min-height: 78px;
  border: 1px solid #d9ecdf;
  border-radius: 12px;
  background-color: #fff;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.day-cell:hover {
  border-color: var(--primary);
  box-shadow: 0 6px 12px rgba(0, 103, 71, 0.08);
  transform: translateY(-1px);
}

.day-cell.blank {
  background-color: transparent;
  border-color: transparent;
  cursor: default;
}

.day-cell.blank:hover {
  box-shadow: none;
  transform: none;
}

.day-cell.today {
  border-color: var(--primary);
  background-color: #f1faf3;
}

.day-cell.has-events {
  box-shadow: 0 4px 10px rgba(0, 103, 71, 0.06);
}

.day-number {
  font-weight: 700;
  color: var(--text-dark);
}

.badge {
  margin-top: auto;
  align-self: flex-end;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  border-radius: 999px;
  background-color: var(--primary);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 640px) {
  .day-cell {
    min-height: 60px;
    padding: 0.35rem;
  }

  .day-number {
    font-size: 0.85rem;
  }
}
</style>
