<script setup>
const props = defineProps({
  currentSection: {
    type: String,
    default: 'general'
  }
})

const emit = defineEmits(['select'])

const menuItems = [
  {
    id: 'general',
    title: 'Resumen del negocio',
    description: 'Vista general de tu operación diaria'
  },
  {
    id: 'appointments',
    title: 'Gestionar citas',
    description: 'Ver y cancelar citas de tu local'
  },
  {
    id: 'business-profile',
    title: 'Información del negocio',
    description: 'Configurar nombre, horarios y servicios'
  },
  {
    id: 'staff',
    title: 'Especialistas del negocio',
    description: 'Agregar, editar y activar tu equipo'
  }
]
</script>

<template>
  <aside class="sidebar panel-card" aria-label="Menú del negocio">
    <p class="sidebar-eyebrow">Panel del negocio</p>
    <h2>AgendaPro Owner</h2>

    <ul class="menu-list">
      <li v-for="item in menuItems" :key="item.id">
        <button
          class="menu-item"
          :class="{ active: props.currentSection === item.id }"
          type="button"
          @click="emit('select', item.id)"
        >
          <span class="title">{{ item.title }}</span>
          <span class="description">{{ item.description }}</span>
        </button>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.sidebar {
  height: fit-content;
  position: sticky;
  top: 90px;
}

.sidebar-eyebrow {
  margin: 0;
  color: #648f4f;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h2 {
  margin: 0.5rem 0 1rem;
  color: var(--primary);
  font-size: 1.2rem;
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.menu-item {
  width: 100%;
  text-align: left;
  border: 1px solid #d9ecdf;
  border-radius: 12px;
  background: #fff;
  padding: 0.75rem 0.8rem;
  display: grid;
  gap: 0.2rem;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.menu-item:hover {
  transform: translateY(-1px);
  border-color: #9dc59b;
  box-shadow: 0 8px 16px rgba(0, 103, 71, 0.08);
}

.menu-item.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 103, 71, 0.13);
  background-color: #f6fffb;
}

.title {
  color: var(--text-dark);
  font-weight: 700;
}

.description {
  color: #5d7a53;
  font-size: 0.84rem;
}

@media (max-width: 980px) {
  .sidebar {
    position: static;
  }
}
</style>
