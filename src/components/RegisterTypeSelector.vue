<script setup>
import { ROLE_CLIENTE, ROLE_OWNER } from '../utils/roleHelpers'

const props = defineProps({
  modelValue: {
    type: String,
    default: ROLE_CLIENTE
  }
})

const emit = defineEmits(['update:modelValue'])

const accountTypes = [
  {
    value: ROLE_CLIENTE,
    title: 'Quiero registrarme como cliente',
    description: 'Agenda, consulta, reagenda y cancela tus propias citas.'
  },
  {
    value: ROLE_OWNER,
    title: 'Quiero registrar mi negocio',
    description: 'Administra las citas y la información de tu local.'
  }
]
</script>

<template>
  <div class="type-selector" role="radiogroup" aria-label="Tipo de cuenta">
    <button
      v-for="type in accountTypes"
      :key="type.value"
      type="button"
      class="type-card"
      :class="{ active: props.modelValue === type.value }"
      @click="emit('update:modelValue', type.value)"
    >
      <span class="title">{{ type.title }}</span>
      <span class="description">{{ type.description }}</span>
    </button>
  </div>
</template>

<style scoped>
.type-selector {
  display: grid;
  gap: 0.65rem;
}

.type-card {
  text-align: left;
  border: 1px solid #d8ebdf;
  background: #fff;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  cursor: pointer;
  display: grid;
  gap: 0.2rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.type-card:hover {
  border-color: #9dc59b;
}

.type-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 103, 71, 0.13);
  background: #f6fffb;
}

.title {
  color: var(--text-dark);
  font-weight: 700;
}

.description {
  color: #5f7c55;
  font-size: 0.86rem;
}
</style>
