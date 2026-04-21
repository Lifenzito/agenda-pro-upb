<script setup>
import { RouterLink } from 'vue-router'
import AppointmentForm from '../components/AppointmentForm.vue'
import { useAuth } from '../composables/useAuth'

const { user, isAuthenticated } = useAuth()
</script>

<template>
  <section class="booking-view app-container">
    <header class="view-header">
      <h1>Agendar cita</h1>
      <p>Reserva tu turno, elige especialista disponible y consulta tu cita por teléfono para reagendar o cancelar.</p>
    </header>

    <AppointmentForm
      mode="create"
      card-title="Nueva cita"
      card-description="Selecciona un negocio y completa los datos para registrar la cita."
      :current-user="user"
    />

    <div v-if="!isAuthenticated" class="panel-card auth-priority-note">
      <h2>¿Ya tienes cuenta?</h2>
      <p>
        Puedes agendar de forma pública, pero si inicias sesión podrás gestionar tus citas desde
        tu panel personal.
      </p>
      <div class="auth-actions">
        <RouterLink class="btn btn-primary" to="/login">Ir a login</RouterLink>
        <RouterLink class="btn btn-secondary" to="/registro">Ir a registro</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.booking-view {
  display: grid;
  gap: 1.1rem;
  padding-bottom: 1.5rem;
}

.view-header h1 {
  margin: 0;
  color: var(--primary);
}

.view-header p {
  margin: 0.45rem 0 0;
  color: #4f6a45;
}

.auth-priority-note h2 {
  margin: 0;
  color: var(--primary);
}

.auth-priority-note p {
  margin: 0.55rem 0 0.9rem;
  color: #4f6a45;
}

.auth-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
</style>
