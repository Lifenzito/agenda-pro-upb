<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  business: {
    type: Object,
    default: null
  },
  saveHandler: {
    type: Function,
    required: true
  }
})

const form = reactive({
  nombre: '',
  horarioInicio: '08:00',
  horarioFin: '18:00',
  servicios: ''
})

const loading = ref(false)
const message = ref({ type: '', text: '' })

watch(
  () => props.business,
  (business) => {
    form.nombre = business?.nombre ?? ''
    form.horarioInicio = business?.horarioInicio ?? '08:00'
    form.horarioFin = business?.horarioFin ?? '18:00'
    form.servicios = Array.isArray(business?.servicios) ? business.servicios.join(', ') : ''
    message.value = { type: '', text: '' }
  },
  { immediate: true }
)

const handleSave = async () => {
  if (loading.value) return

  message.value = { type: '', text: '' }

  if (!form.nombre.trim() || !form.horarioInicio || !form.horarioFin) {
    message.value = { type: 'error', text: 'Completa nombre y horario del negocio.' }
    return
  }

  if (form.horarioInicio >= form.horarioFin) {
    message.value = {
      type: 'error',
      text: 'La hora de inicio debe ser anterior a la hora de cierre.'
    }
    return
  }

  loading.value = true

  try {
    const servicios = form.servicios
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    await props.saveHandler({
      nombre: form.nombre.trim(),
      horarioInicio: form.horarioInicio,
      horarioFin: form.horarioFin,
      servicios
    })

    message.value = { type: 'success', text: 'Información del negocio actualizada.' }
  } catch (error) {
    console.error(error)
    message.value = { type: 'error', text: 'No se pudo guardar la información. Intenta nuevamente.' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="panel-card profile-card">
    <header>
      <h2>Información del negocio</h2>
      <p>Configura los datos principales de tu local para la operación diaria.</p>
    </header>

    <form class="profile-form" @submit.prevent="handleSave">
      <label class="field">
        <span>Nombre del negocio</span>
        <input v-model="form.nombre" type="text" :disabled="loading" required />
      </label>

      <div class="hours-grid">
        <label class="field">
          <span>Horario inicio</span>
          <input v-model="form.horarioInicio" type="time" :disabled="loading" required />
        </label>

        <label class="field">
          <span>Horario fin</span>
          <input v-model="form.horarioFin" type="time" :disabled="loading" required />
        </label>
      </div>

      <label class="field">
        <span>Servicios (separados por coma)</span>
        <input
          v-model="form.servicios"
          type="text"
          placeholder="Corte de cabello, Tinte, Manicure"
          :disabled="loading"
        />
      </label>

      <button class="btn btn-primary" type="submit" :disabled="loading">
        {{ loading ? 'Guardando...' : 'Guardar cambios' }}
      </button>

      <p v-if="message.text" :class="['feedback-message', message.type]">
        {{ message.text }}
      </p>
    </form>
  </section>
</template>

<style scoped>
.profile-card {
  display: grid;
  gap: 0.9rem;
}

h2 {
  margin: 0;
  color: var(--primary);
}

p {
  margin: 0.45rem 0 0;
  color: #4f6a45;
}

.profile-form {
  display: grid;
  gap: 0.8rem;
}

.hours-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field span {
  font-weight: 600;
}

.field input {
  width: 100%;
  border: 1px solid #c7dfd3;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background-color: #fcfffd;
  color: var(--text-dark);
}

.field input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 103, 71, 0.12);
  outline: none;
}

.feedback-message {
  margin: 0;
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

@media (max-width: 760px) {
  .hours-grid {
    grid-template-columns: 1fr;
  }
}
</style>
