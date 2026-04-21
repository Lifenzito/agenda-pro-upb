<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  workers: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  showEmptyMessage: {
    type: Boolean,
    default: true
  },
  emptyLabel: {
    type: String,
    default: 'Sin especialistas activos'
  },
  emptyMessage: {
    type: String,
    default:
      'Este negocio no tiene especialistas activos. La cita se registrará como “Sin asignar”.'
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const hasWorkers = computed(() => props.workers.length > 0)

const workerLabel = (worker) => {
  const role = String(worker?.rol ?? worker?.especialidad ?? '').trim()
  const name = String(worker?.nombre ?? '').trim() || 'Especialista'
  return role ? `${name} · ${role}` : name
}
</script>

<template>
  <div class="worker-select">
    <label class="field field-full">
      <span>Especialista</span>
      <select
        v-model="selectedValue"
        :disabled="disabled || loading || !hasWorkers"
        :required="required && hasWorkers"
      >
        <option value="" disabled>
          {{ loading ? 'Cargando especialistas...' : hasWorkers ? 'Selecciona un especialista' : emptyLabel }}
        </option>
        <option v-for="worker in workers" :key="worker.id" :value="worker.id">
          {{ workerLabel(worker) }}
        </option>
      </select>
    </label>

    <small v-if="showEmptyMessage && !loading && !hasWorkers" class="worker-helper">
      {{ emptyMessage }}
    </small>
  </div>
</template>

<style scoped>
.worker-select {
  display: grid;
  gap: 0.35rem;
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

.field select {
  width: 100%;
  border: 1px solid #c7dfd3;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background-color: #fcfffd;
  color: var(--text-dark);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 103, 71, 0.12);
  outline: none;
}

.worker-helper {
  color: #6b855f;
  font-weight: 600;
  font-size: 0.82rem;
}
</style>
