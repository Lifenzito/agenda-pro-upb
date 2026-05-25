<script setup>
/**
 * Vista de tiendas/negocios visitados recientemente.
 * Lee el historial desde localStorage y permite acceder directamente al enlace público.
 */
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getRecentBusinesses, clearRecentBusinesses } from '../utils/recentBusinesses'

const businesses = ref([])

onMounted(() => {
  businesses.value = getRecentBusinesses()
})

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleClear = () => {
  clearRecentBusinesses()
  businesses.value = []
}
</script>

<template>
  <section class="recent-view app-container">
    <header class="panel-card view-header">
      <div class="header-row">
        <div>
          <h1>Tiendas recientes</h1>
          <p>Negocios que has visitado recientemente. Haz clic para volver a agendar.</p>
        </div>
        <button
          v-if="businesses.length"
          class="btn btn-secondary btn-sm"
          type="button"
          @click="handleClear"
        >
          Limpiar historial
        </button>
      </div>
    </header>

    <div v-if="!businesses.length" class="panel-card empty-card">
      <p>No has visitado ningún negocio todavía.</p>
      <p class="hint">Cuando entres a la página pública de un negocio, aparecerá aquí.</p>
    </div>

    <div v-else class="business-grid">
      <RouterLink
        v-for="entry in businesses"
        :key="entry.slug"
        :to="`/negocio/${entry.slug}`"
        class="panel-card business-card"
      >
        <img
          v-if="entry.fotoPerfilURL"
          :src="entry.fotoPerfilURL"
          :alt="entry.nombre"
          class="business-avatar"
        />
        <div v-else class="business-avatar placeholder">
          {{ (entry.nombre || '?')[0].toUpperCase() }}
        </div>

        <div class="business-info">
          <strong>{{ entry.nombre || entry.slug }}</strong>
          <small v-if="entry.visitedAt">Visitado {{ formatDate(entry.visitedAt) }}</small>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.recent-view {
  display: grid;
  gap: 1rem;
  padding-bottom: 1.5rem;
}

.view-header h1 {
  margin: 0;
  color: var(--primary);
}

.view-header p {
  margin: 0.5rem 0 0;
  color: #4f6a45;
}

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  border-radius: 10px;
  white-space: nowrap;
}

.empty-card {
  text-align: center;
  padding: 2rem 1.5rem;
}

.empty-card p {
  margin: 0;
  color: #5d7a53;
  font-weight: 600;
}

.empty-card .hint {
  margin-top: 0.4rem;
  font-weight: 400;
  font-size: 0.9rem;
}

.business-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.business-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.business-card:hover {
  transform: translateY(-2px);
  border-color: #9dc59b;
  box-shadow: 0 8px 18px rgba(0, 103, 71, 0.1);
}

.business-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #e0f0e6;
}

.business-avatar.placeholder {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary), #0a7f58);
  color: #fff;
  font-weight: 800;
  font-size: 1.2rem;
}

.business-info {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.business-info strong {
  color: var(--text-dark);
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-info small {
  color: #6a8a5f;
  font-size: 0.82rem;
}
</style>
