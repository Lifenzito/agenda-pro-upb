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

      <div class="avatar" :class="{ placeholder: !profileUrl }">
        <img v-if="profileUrl" :src="profileUrl" :alt="`Foto de ${businessName}`" />
        <span v-else>{{ initials }}</span>
      </div>
    </div>

    <div class="header-body">
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
  position: relative;
  width: 100%;
  height: 240px;
  background: linear-gradient(135deg, #006747 0%, #5ec48a 100%);
}

.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.banner.placeholder::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #006747 0%, #5ec48a 100%);
}

.avatar {
  position: absolute;
  bottom: -45px;
  left: 40px;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background-color: #fff;
  padding: 6px;
  box-shadow: 0 12px 28px rgba(0, 103, 71, 0.18);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.avatar.placeholder {
  background: linear-gradient(135deg, #006747 0%, #5ec48a 100%);
  color: #fff;
  font-weight: 700;
  font-size: 2rem;
}

.avatar.placeholder span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.header-body {
  padding: 0.75rem 1.75rem 1.5rem calc(40px + 130px + 1.5rem);
  min-height: 70px;
  display: flex;
  align-items: center;
}

.info {
  flex: 1;
}

.info h1 {
  margin: 0 0 0.3rem;
  color: var(--primary);
  font-size: 1.65rem;
  line-height: 1.2;
}

.schedule {
  margin: 0;
  color: #5d7a53;
  font-size: 0.95rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .banner {
    height: 160px;
  }

  .avatar {
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    width: 110px;
    height: 110px;
  }

  .header-body {
    padding: 3rem 1.25rem 1.25rem;
    justify-content: center;
    text-align: center;
  }

  .info h1 {
    font-size: 1.35rem;
  }
}
</style>
