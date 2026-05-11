<script setup>
/**
 * Componente raíz de la aplicación.
 * Define la estructura general (navbar + router view) y el contenedor visual principal.
 */
import AppNavbar from './components/AppNavbar.vue'
</script>

<template>
  <div class="app-shell">
    <AppNavbar />

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
