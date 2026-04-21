<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { isAuthenticated, isOwner, loading, performLogout } = useAuth()

const heroActions = computed(() => {
  if (!isAuthenticated.value) {
    return {
      primary: { type: 'route', to: '/login', label: 'Iniciar sesión' },
      secondary: { type: 'route', to: '/registro', label: 'Registrarse' }
    }
  }

  if (isOwner.value) {
    return {
      primary: { type: 'route', to: '/panel-negocio', label: 'Panel del negocio' },
      secondary: { type: 'action', action: 'logout', label: 'Cerrar sesión' }
    }
  }

  return {
    primary: { type: 'route', to: '/agendar', label: 'Agendar cita' },
    secondary: { type: 'route', to: '/mis-citas', label: 'Mis citas' }
  }
})

const handleHeroAction = async (action) => {
  if (loading.value) return
  if (action !== 'logout') return

  try {
    await performLogout()
    router.push('/login')
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <section class="home-hero app-container">
    <div class="hero-card">
      <p class="eyebrow">AgendaPro · Gestión de citas</p>
      <h1>Organiza citas con una experiencia moderna y profesional</h1>
      <p class="lead">
        AgendaPro centraliza el registro y la administración de citas en una interfaz clara,
        rápida y lista para crecer.
      </p>

      <div class="hero-actions">
        <RouterLink
          v-if="heroActions.primary.type === 'route'"
          class="btn btn-primary"
          :to="heroActions.primary.to"
        >
          {{ heroActions.primary.label }}
        </RouterLink>

        <RouterLink
          v-if="heroActions.secondary.type === 'route'"
          class="btn btn-secondary"
          :to="heroActions.secondary.to"
        >
          {{ heroActions.secondary.label }}
        </RouterLink>

        <button
          v-else
          class="btn btn-danger"
          type="button"
          :disabled="loading"
          @click="handleHeroAction(heroActions.secondary.action)"
        >
          {{ loading ? 'Procesando...' : heroActions.secondary.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  padding-top: 2rem;
  padding-bottom: 2.5rem;
}

.hero-card {
  background: linear-gradient(160deg, #ffffff 0%, #f6fffa 70%);
  border: 1px solid rgba(0, 103, 71, 0.13);
  border-radius: 24px;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.07);
  padding: clamp(1.4rem, 4vw, 2.5rem);
}

.eyebrow {
  margin: 0;
  color: #6a9657;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.78rem;
}

h1 {
  margin: 0.7rem 0 0;
  color: var(--primary);
  line-height: 1.1;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  letter-spacing: -0.03em;
  max-width: 760px;
}

.lead {
  margin: 1rem 0 0;
  color: #3f5f37;
  max-width: 700px;
  line-height: 1.6;
}

.hero-actions {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
