<script setup>
import { computed } from 'vue'

const props = defineProps({
  business: {
    type: Object,
    required: true
  }
})

const bannerUrl = computed(() => String(props.business?.banner ?? '').trim())
const profileUrl = computed(() => String(props.business?.fotoPerfil ?? '').trim())
const businessName = computed(() => String(props.business?.nombre ?? '').trim() || 'Negocio')
const horarioInicio = computed(() => String(props.business?.horarioInicio ?? '').trim())
const horarioFin = computed(() => String(props.business?.horarioFin ?? '').trim())

const initials = computed(() => {
  const parts = businessName.value.split(/\s+/).filter(Boolean)
  if (!parts.length) return 'N'
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
})

const horarioLabel = computed(() => {
  if (!horarioInicio.value && !horarioFin.value) return ''
  if (horarioInicio.value && horarioFin.value) {
    return `${horarioInicio.value} – ${horarioFin.value}`
  }
  return horarioInicio.value || horarioFin.value
})
</script>

<template>
  <header class="public-header panel-card">
    <div class="banner" :class="{ placeholder: !bannerUrl }">
      <img v-if="bannerUrl" :src="bannerUrl" :alt="`Banner de ${businessName}`" />
    </div>

    <div class="header-body">
      <div class="avatar" :class="{ placeholder: !profileUrl }">
        <img v-if="profileUrl" :src="profileUrl" :alt="`Foto de ${businessName}`" />
        <span v-else>{{ initials }}</span>
      </div>

      <div class="info">
        <h1>{{ businessName }}</h1>
        <p v-if="horarioLabel" class="schedule">Horario de atención: {{ horarioLabel }}</p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.public-header {
  padding: 0;
  overflow: hidden;
}

.banner {
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #006747 0%, #5ec48a 100%);
  position: relative;
}

.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.banner.placeholder::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #006747 0%, #5ec48a 100%);
}

.header-body {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  padding: 0 1.5rem 1.5rem;
  margin-top: -56px;
}

.avatar {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  border: 4px solid #fff;
  background-color: #fff;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(0, 103, 71, 0.15);
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar.placeholder {
  background: linear-gradient(135deg, #006747 0%, #5ec48a 100%);
  color: #fff;
  font-weight: 700;
  font-size: 2rem;
}

.info {
  flex: 1;
  padding-bottom: 0.25rem;
}

.info h1 {
  margin: 0 0 0.25rem;
  color: var(--primary);
  font-size: 1.6rem;
}

.schedule {
  margin: 0;
  color: #5d7a53;
  font-size: 0.95rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .banner {
    height: 140px;
  }

  .header-body {
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: -48px;
  }

  .avatar {
    width: 96px;
    height: 96px;
  }
}
</style>
