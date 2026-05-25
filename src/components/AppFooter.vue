<script setup>
/**
 * Pie de página global con enlaces legales.
 */
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner app-container">
      <span class="footer-brand">&copy; {{ new Date().getFullYear() }} AgendaPro</span>
      <nav class="footer-links">
        <RouterLink to="/privacidad">Política de Privacidad</RouterLink>
        <span class="sep">·</span>
        <RouterLink to="/terminos">Términos y Condiciones</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: auto;
  border-top: 1px solid rgba(0, 103, 71, 0.1);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(6px);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  font-size: 0.85rem;
}

.footer-brand {
  color: #5d7a53;
  font-weight: 600;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.footer-links a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: #0a7f58;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.sep {
  color: #9db894;
}

@media (max-width: 520px) {
  .footer-inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
