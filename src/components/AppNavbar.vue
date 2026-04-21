<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { user, isAuthenticated, isOwner, isClient, profileError, loading, performLogout, initAuth } = useAuth()

initAuth()

const links = computed(() => {
  const baseLinks = [{ to: '/', label: 'Inicio' }]

  if (!isAuthenticated.value) {
    return [
      ...baseLinks,
      { to: '/login', label: 'Login' },
      { to: '/registro', label: 'Registro' }
    ]
  }

  if (profileError.value) {
    return baseLinks
  }

  if (isOwner.value) {
    return [...baseLinks, { to: '/panel-negocio', label: 'Panel del negocio' }]
  }

  if (isClient.value) {
    return [...baseLinks, { to: '/agendar', label: 'Agendar cita' }, { to: '/mis-citas', label: 'Mis citas' }]
  }

  return baseLinks
})

const profileErrorMessage = computed(() => {
  if (!profileError.value) return ''
  if (profileError.value === 'read_failed') {
    return 'No pudimos leer tu perfil. Cierra sesión y vuelve a intentarlo.'
  }
  return 'Tu cuenta no tiene un perfil válido. Cierra sesión y contacta al administrador.'
})

const handleLogout = async () => {
  if (loading.value) return

  try {
    await performLogout()
    router.push('/login')
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <header class="app-navbar">
    <div class="navbar-inner app-container">
      <RouterLink class="brand" to="/">
        <span class="brand-dot" />
        <span>AgendaPro</span>
      </RouterLink>

      <nav class="nav-links" aria-label="Navegación principal">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          active-class="is-active"
        >
          {{ link.label }}
        </RouterLink>

        <button
          v-if="isAuthenticated"
          class="nav-link nav-button"
          type="button"
          :disabled="loading"
          @click="handleLogout"
        >
          Cerrar sesión
        </button>
      </nav>
    </div>

    <div v-if="isAuthenticated && user?.email" class="user-chip app-container">
      Sesión: {{ user.email }}
    </div>

    <div v-if="profileErrorMessage" class="profile-error app-container" role="alert">
      {{ profileErrorMessage }}
    </div>
  </header>
</template>

<style scoped>
.app-navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.86);
  border-bottom: 1px solid rgba(0, 103, 71, 0.12);
}

.navbar-inner {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary);
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: 0 0 0 5px rgba(0, 103, 71, 0.12);
}

.nav-links {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #3d6244;
  font-weight: 600;
  font-size: 0.94rem;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.nav-button {
  border: none;
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
}

.nav-link:hover {
  background-color: rgba(140, 171, 24, 0.16);
  color: #2e5522;
}

.nav-link.is-active {
  color: #fff;
  background: linear-gradient(90deg, var(--primary), #0a7f58);
}

.user-chip {
  margin-bottom: 0.55rem;
  color: #527145;
  font-size: 0.84rem;
  font-weight: 600;
}

.profile-error {
  margin-bottom: 0.55rem;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  background: rgba(220, 53, 69, 0.1);
  color: #8a1f28;
  font-size: 0.88rem;
  font-weight: 600;
  border: 1px solid rgba(220, 53, 69, 0.25);
}

@media (max-width: 820px) {
  .navbar-inner {
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding-top: 0.55rem;
    padding-bottom: 0.75rem;
  }

  .nav-links {
    width: 100%;
    overflow: auto;
    padding-bottom: 0.2rem;
  }
}
</style>
