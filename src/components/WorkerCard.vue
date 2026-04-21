<script setup>
import { computed } from 'vue'

const props = defineProps({
  worker: {
    type: Object,
    required: true
  },
  processing: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'toggle-active', 'delete'])

const services = computed(() => {
  const list = Array.isArray(props.worker?.serviciosAsignados)
    ? props.worker.serviciosAsignados
    : []
  return list.filter((service) => String(service ?? '').trim().length > 0)
})

const roleLabel = computed(() => {
  const role = String(props.worker?.rol ?? props.worker?.especialidad ?? '').trim()
  return role || 'Sin rol asignado'
})

const descriptionLabel = computed(() => {
  const description = String(props.worker?.descripcion ?? '').trim()
  return description || 'Sin descripción'
})

const isBusy = computed(() => props.processing || props.disabled)
</script>

<template>
  <article class="worker-card" :class="{ inactive: !worker.activo }">
    <header class="worker-card-header">
      <div class="worker-heading">
        <h3>{{ worker.nombre || 'Especialista sin nombre' }}</h3>
        <span class="worker-role">{{ roleLabel }}</span>
      </div>

      <span :class="['status-pill', worker.activo ? 'active' : 'inactive']">
        {{ worker.activo ? 'Activo' : 'Inactivo' }}
      </span>
    </header>

    <p class="worker-description">{{ descriptionLabel }}</p>

    <div class="worker-services">
      <span class="services-label">Servicios:</span>
      <ul v-if="services.length" class="services-chips">
        <li v-for="service in services" :key="service" class="service-chip">
          {{ service }}
        </li>
      </ul>
      <span v-else class="services-empty">Sin servicios asignados</span>
    </div>

    <div class="worker-actions">
      <button
        class="btn btn-secondary btn-table"
        type="button"
        :disabled="isBusy"
        @click="emit('edit', worker)"
      >
        Editar
      </button>

      <button
        class="btn btn-secondary btn-table"
        type="button"
        :disabled="isBusy"
        @click="emit('toggle-active', worker)"
      >
        {{ worker.activo ? 'Desactivar' : 'Activar' }}
      </button>

      <button
        class="btn btn-danger btn-table"
        type="button"
        :disabled="isBusy"
        @click="emit('delete', worker)"
      >
        Eliminar
      </button>
    </div>
  </article>
</template>

<style scoped>
.worker-card {
  display: grid;
  gap: 0.55rem;
  border: 1px solid #d5ecdf;
  border-radius: 14px;
  padding: 0.9rem 1rem;
  background: #fcfffd;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.worker-card:hover {
  border-color: #9dc59b;
  box-shadow: 0 8px 16px rgba(0, 103, 71, 0.08);
}

.worker-card.inactive {
  background: #f7f7f5;
  opacity: 0.85;
}

.worker-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.worker-heading {
  display: grid;
  gap: 0.1rem;
}

.worker-heading h3 {
  margin: 0;
  color: var(--primary);
  font-size: 1.05rem;
}

.worker-role {
  color: #4f6a45;
  font-weight: 600;
  font-size: 0.88rem;
}

.worker-description {
  margin: 0;
  color: #4f6a45;
  font-size: 0.92rem;
}

.worker-services {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.services-label {
  font-weight: 600;
  color: var(--text-dark);
  font-size: 0.88rem;
}

.services-chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.service-chip {
  border: 1px solid #c7dfd3;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  background: #f2fdf7;
  color: #1e5a3a;
  font-size: 0.82rem;
  font-weight: 600;
}

.services-empty {
  color: #8b6e1e;
  font-weight: 600;
  font-size: 0.86rem;
}

.worker-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
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

.btn-table {
  min-width: 88px;
  padding: 0.45rem 0.7rem;
  font-size: 0.87rem;
}
</style>
