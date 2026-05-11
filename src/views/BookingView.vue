<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <section class="booking-view app-container">
    <header class="view-header">
      <h1>Agendar cita</h1>
    </header>

    <article class="panel-card info-card">
      <p class="lead">Para agendar una cita, ingresa desde el enlace público del negocio.</p>
      <p>Puedes solicitar el enlace al negocio o acceder desde sus redes sociales.</p>
      <div class="actions">
        <button class="btn btn-primary" type="button" @click="goHome">Volver al inicio</button>
      </div>
    </article>
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

.info-card {
  display: grid;
  gap: 0.6rem;
}

.info-card .lead {
  margin: 0;
  color: var(--primary);
  font-weight: 600;
  font-size: 1.05rem;
}

.info-card p {
  margin: 0;
  color: #4f6a45;
}

.actions {
  margin-top: 0.4rem;
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
</style>
