<script setup>
import { computed } from 'vue'
import {
  formatWorkerExperience,
  formatWorkerRating,
  normalizeWorker
} from '../utils/workerHelpers'

const props = defineProps({
  worker: {
    type: Object,
    required: true
  },
  processing: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'toggle', 'delete'])

const normalizedWorker = computed(() => normalizeWorker(props.worker))
const statusLabel = computed(() => (normalizedWorker.value.activo ? 'Activo' : 'Inactivo'))
const statusClass = computed(() => (normalizedWorker.value.activo ? 'is-active' : 'is-inactive'))
</script>

<template>
  <article class="worker-card" :class="[{ compact }, statusClass]">
    <div class="worker-card__top">
      <div>
        <p class="worker-card__eyebrow">{{ normalizedWorker.rol }}</p>
        <h3>{{ normalizedWorker.nombre }}</h3>
      </div>
      <span class="status-pill">{{ statusLabel }}</span>
    </div>

    <p class="worker-card__description">{{ normalizedWorker.descripcion }}</p>

    <div class="worker-card__metrics">
      <div>
        <span>Rating</span>
        <strong>{{ formatWorkerRating(normalizedWorker.rating) }}</strong>
      </div>
      <div>
        <span>Experiencia</span>
        <strong>{{ formatWorkerExperience(normalizedWorker.aniosExperiencia) }}</strong>
      </div>
    </div>

    <div class="worker-card__services">
      <span v-for="service in normalizedWorker.serviciosAsignados" :key="service" class="service-tag">
        {{ service }}
      </span>
    </div>

    <p v-if="normalizedWorker.legacyProfile" class="legacy-note">
      Perfil heredado adaptado automáticamente a los servicios actuales del negocio.
    </p>

    <div v-if="!compact" class="worker-card__actions">
      <button class="btn btn-secondary" type="button" :disabled="processing" @click="emit('edit', worker)">
        Editar
      </button>
      <button class="btn btn-primary" type="button" :disabled="processing" @click="emit('toggle', worker)">
        {{ normalizedWorker.activo ? 'Desactivar' : 'Activar' }}
      </button>
      <button class="btn btn-danger" type="button" :disabled="processing" @click="emit('delete', worker)">
        Eliminar
      </button>
    </div>
  </article>
</template>

<style scoped>
.worker-card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid rgba(0, 103, 71, 0.12);
  background:
    linear-gradient(180deg, rgba(229, 249, 242, 0.72) 0%, rgba(255, 255, 255, 0.98) 45%),
    #ffffff;
  box-shadow: 0 16px 30px rgba(0, 103, 71, 0.08);
}

.worker-card.compact {
  gap: 0.75rem;
  padding: 0.9rem;
}

.worker-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;
}

.worker-card__eyebrow {
  margin: 0 0 0.18rem;
  color: var(--accent);
  font-weight: 800;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.worker-card h3 {
  margin: 0;
  color: var(--primary);
}

.worker-card__description {
  margin: 0;
  color: #4f6a45;
  line-height: 1.55;
}

.worker-card__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.worker-card__metrics div {
  padding: 0.8rem 0.85rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 103, 71, 0.08);
}

.worker-card__metrics span {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #65805a;
}

.worker-card__metrics strong {
  color: var(--text-dark);
  font-size: 0.95rem;
}

.worker-card__services {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.service-tag {
  padding: 0.42rem 0.65rem;
  border-radius: 999px;
  background: rgba(140, 171, 24, 0.14);
  color: #446727;
  font-weight: 700;
  font-size: 0.82rem;
}

.status-pill {
  padding: 0.42rem 0.72rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.79rem;
  white-space: nowrap;
}

.is-active .status-pill {
  background: rgba(0, 103, 71, 0.12);
  color: var(--primary);
}

.is-inactive .status-pill {
  background: rgba(179, 38, 30, 0.1);
  color: var(--danger);
}

.worker-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.legacy-note {
  margin: 0;
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  background: rgba(229, 249, 242, 0.9);
  color: #527146;
  font-weight: 600;
  font-size: 0.84rem;
}

@media (max-width: 640px) {
  .worker-card__top,
  .worker-card__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .worker-card__metrics {
    grid-template-columns: 1fr;
  }
}

</style>
