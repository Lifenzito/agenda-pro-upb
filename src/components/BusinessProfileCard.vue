<script setup>
/**
 * Tarjeta de perfil del negocio.
 * Muestra y permite editar datos generales, horarios y servicios del establecimiento.
 */
import { computed, reactive, ref, watch } from 'vue'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { storage } from '../services/firebase'

const props = defineProps({
  business: {
    type: Object,
    default: null
  },
  saveHandler: {
    type: Function,
    required: true
  }
})

const form = reactive({
  nombre: '',
  horarioInicio: '08:00',
  horarioFin: '18:00',
  servicios: '',
  fotoPerfil: '',
  banner: ''
})

const loading = ref(false)
const message = ref({ type: '', text: '' })
const profileUploading = ref(false)
const bannerUploading = ref(false)
const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp'

const isUploadingMedia = computed(() => profileUploading.value || bannerUploading.value)

const publicSlug = computed(() => String(props.business?.slug ?? '').trim())

const publicUrl = computed(() => {
  if (!publicSlug.value) return ''
  if (typeof window === 'undefined') return `/negocio/${publicSlug.value}`
  return `${window.location.origin}/negocio/${publicSlug.value}`
})

const copyState = ref('idle')

const handleCopyPublicUrl = async () => {
  if (!publicUrl.value) return
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(publicUrl.value)
    } else {
      const helper = document.createElement('textarea')
      helper.value = publicUrl.value
      helper.setAttribute('readonly', '')
      helper.style.position = 'absolute'
      helper.style.left = '-9999px'
      document.body.appendChild(helper)
      helper.select()
      document.execCommand('copy')
      document.body.removeChild(helper)
    }
    copyState.value = 'copied'
    setTimeout(() => {
      if (copyState.value === 'copied') copyState.value = 'idle'
    }, 2000)
  } catch (error) {
    console.error(error)
    copyState.value = 'error'
    setTimeout(() => {
      if (copyState.value === 'error') copyState.value = 'idle'
    }, 2000)
  }
}

watch(
  () => props.business,
  (business) => {
    form.nombre = business?.nombre ?? ''
    form.horarioInicio = business?.horarioInicio ?? '08:00'
    form.horarioFin = business?.horarioFin ?? '18:00'
    form.servicios = Array.isArray(business?.servicios) ? business.servicios.join(', ') : ''
    form.fotoPerfil = business?.fotoPerfil ?? ''
    form.banner = business?.banner ?? ''
    message.value = { type: '', text: '' }
  },
  { immediate: true }
)

const isValidUrl = (value) => {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const profilePreview = computed(() =>
  isValidUrl(form.fotoPerfil) ? String(form.fotoPerfil ?? '').trim() : ''
)

const bannerPreview = computed(() =>
  isValidUrl(form.banner) ? String(form.banner ?? '').trim() : ''
)

const sanitizeFilename = (name) =>
  String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')

const isAllowedImageFile = (file) => {
  const fileName = String(file?.name ?? '').toLowerCase()
  const validExtension = /\.(jpg|jpeg|png|webp)$/.test(fileName)
  const validMimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(file?.type)
  return validExtension || validMimeType
}

const uploadBusinessImage = async (file, folder) => {
  const safeName = sanitizeFilename(file.name) || 'image'
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`
  const imageRef = storageRef(storage, `business-images/${folder}/${uniqueName}`)

  await uploadBytes(imageRef, file, {
    contentType: file.type || 'application/octet-stream'
  })

  return getDownloadURL(imageRef)
}

const handleMediaUpload = async (event, type) => {
  const target = event.target
  const file = target?.files?.[0]

  if (!file) return

  if (!isAllowedImageFile(file)) {
    message.value = {
      type: 'error',
      text: 'Formato no válido. Usa imágenes .jpg, .jpeg, .png o .webp.'
    }
    target.value = ''
    return
  }

  const isProfile = type === 'profile'
  if (isProfile) {
    profileUploading.value = true
  } else {
    bannerUploading.value = true
  }

  message.value = { type: '', text: 'Subiendo imagen...' }

  try {
    const folder = isProfile ? 'profile' : 'banner'
    const imageUrl = await uploadBusinessImage(file, folder)

    if (isProfile) {
      form.fotoPerfil = imageUrl
    } else {
      form.banner = imageUrl
    }

    message.value = {
      type: 'success',
      text: 'Imagen subida correctamente. Guarda los cambios para aplicarla.'
    }
  } catch (error) {
    console.error(error)
    message.value = {
      type: 'error',
      text: 'No se pudo subir la imagen. Intenta nuevamente.'
    }
  } finally {
    if (isProfile) {
      profileUploading.value = false
    } else {
      bannerUploading.value = false
    }
    target.value = ''
  }
}

const handleSave = async () => {
  if (loading.value || isUploadingMedia.value) return

  message.value = { type: '', text: '' }

  if (!form.nombre.trim() || !form.horarioInicio || !form.horarioFin) {
    message.value = { type: 'error', text: 'Completa nombre y horario del negocio.' }
    return
  }

  if (form.horarioInicio >= form.horarioFin) {
    message.value = {
      type: 'error',
      text: 'La hora de inicio debe ser anterior a la hora de cierre.'
    }
    return
  }

  if (!isValidUrl(form.fotoPerfil)) {
    message.value = { type: 'error', text: 'La URL de la foto de perfil no es válida.' }
    return
  }

  if (!isValidUrl(form.banner)) {
    message.value = { type: 'error', text: 'La URL del banner no es válida.' }
    return
  }

  loading.value = true

  try {
    const servicios = form.servicios
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    await props.saveHandler({
      nombre: form.nombre.trim(),
      horarioInicio: form.horarioInicio,
      horarioFin: form.horarioFin,
      servicios,
      fotoPerfil: String(form.fotoPerfil ?? '').trim(),
      banner: String(form.banner ?? '').trim()
    })

    message.value = { type: 'success', text: 'Información del negocio actualizada.' }
  } catch (error) {
    console.error(error)
    message.value = { type: 'error', text: 'No se pudo guardar la información. Intenta nuevamente.' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="panel-card profile-card">
    <header>
      <h2>Información del negocio</h2>
      <p>Configura los datos principales de tu local para la operación diaria.</p>
    </header>

    <form class="profile-form" @submit.prevent="handleSave">
      <label class="field">
        <span>Nombre del negocio</span>
        <input v-model="form.nombre" type="text" :disabled="loading" required />
      </label>

      <div class="hours-grid">
        <label class="field">
          <span>Horario inicio</span>
          <input v-model="form.horarioInicio" type="time" :disabled="loading" required />
        </label>

        <label class="field">
          <span>Horario fin</span>
          <input v-model="form.horarioFin" type="time" :disabled="loading" required />
        </label>
      </div>

      <label class="field">
        <span>Servicios (separados por coma)</span>
        <input
          v-model="form.servicios"
          type="text"
          placeholder="Corte de cabello, Tinte, Manicure"
          :disabled="loading"
        />
      </label>

      <div class="media-grid">
        <label class="field">
          <span>Foto de perfil (URL)</span>
          <input
            v-model="form.fotoPerfil"
            type="url"
            placeholder="https://..."
            :disabled="loading"
          />
          <input
            type="file"
            :accept="IMAGE_ACCEPT"
            :disabled="loading || isUploadingMedia"
            @change="(event) => handleMediaUpload(event, 'profile')"
          />
          <small v-if="profileUploading" class="upload-status">Subiendo imagen...</small>
          <div class="media-preview profile" aria-hidden="true">
            <img v-if="profilePreview" :src="profilePreview" alt="Vista previa de la foto de perfil" />
            <span v-else class="media-placeholder">Sin foto de perfil</span>
          </div>
        </label>

        <label class="field">
          <span>Banner (URL)</span>
          <input
            v-model="form.banner"
            type="url"
            placeholder="https://..."
            :disabled="loading"
          />
          <input
            type="file"
            :accept="IMAGE_ACCEPT"
            :disabled="loading || isUploadingMedia"
            @change="(event) => handleMediaUpload(event, 'banner')"
          />
          <small v-if="bannerUploading" class="upload-status">Subiendo imagen...</small>
          <div class="media-preview banner" aria-hidden="true">
            <img v-if="bannerPreview" :src="bannerPreview" alt="Vista previa del banner" />
            <span v-else class="media-placeholder">Sin banner</span>
          </div>
        </label>
      </div>

      <div v-if="publicSlug" class="public-link">
        <div class="public-link__head">
          <span class="public-link__label">Enlace público de tu negocio</span>
          <button
            type="button"
            class="btn btn-secondary public-link__copy"
            @click="handleCopyPublicUrl"
          >
            {{ copyState === 'copied' ? '¡Copiado!' : copyState === 'error' ? 'Error' : 'Copiar' }}
          </button>
        </div>
        <a class="public-link__url" :href="publicUrl" target="_blank" rel="noopener">
          {{ publicUrl }}
        </a>
        <p class="public-link__hint">
          Compártelo en redes para que tus clientes agenden directamente en tu página pública.
        </p>
      </div>
      <p v-else class="public-link public-link--missing">
        Tu enlace público se generará automáticamente la próxima vez que abras el panel.
      </p>

      <button class="btn btn-primary" type="submit" :disabled="loading || isUploadingMedia">
        {{ loading ? 'Guardando...' : 'Guardar cambios' }}
      </button>

      <p v-if="message.text" :class="['feedback-message', message.type]">
        {{ message.text }}
      </p>
    </form>
  </section>
</template>

<style scoped>
.profile-card {
  display: grid;
  gap: 0.9rem;
}

h2 {
  margin: 0;
  color: var(--primary);
}

p {
  margin: 0.45rem 0 0;
  color: #4f6a45;
}

.profile-form {
  display: grid;
  gap: 0.8rem;
}

.hours-grid,
.media-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field span {
  font-weight: 600;
}

.field input {
  width: 100%;
  border: 1px solid #c7dfd3;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background-color: #fcfffd;
  color: var(--text-dark);
}

.field input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 103, 71, 0.12);
  outline: none;
}

.media-preview {
  border: 1px dashed #c7dfd3;
  border-radius: 12px;
  background: #f5fbf6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #6b855f;
  font-size: 0.85rem;
}

.media-preview.profile {
  width: 96px;
  height: 96px;
  border-radius: 50%;
}

.media-preview.banner {
  width: 100%;
  height: 120px;
}

.media-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-placeholder {
  padding: 0 0.4rem;
  text-align: center;
}

.upload-status {
  font-size: 0.8rem;
  color: #4f6a45;
}

.feedback-message {
  margin: 0;
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  font-weight: 600;
}

.feedback-message.success {
  background-color: rgba(30, 125, 50, 0.12);
  color: #1e7d32;
}

.feedback-message.error {
  background-color: rgba(179, 38, 30, 0.12);
  color: #b3261e;
}

.public-link {
  display: grid;
  gap: 0.4rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: #f1f8f2;
  border: 1px solid #c7dfd3;
}

.public-link__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.public-link__label {
  font-weight: 600;
  color: var(--primary);
}

.public-link__copy {
  min-width: 92px;
}

.public-link__url {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #1e7d32;
  word-break: break-all;
}

.public-link__hint {
  margin: 0;
  font-size: 0.8rem;
  color: #4f6a45;
}

.public-link--missing {
  margin: 0;
  color: #6b855f;
  font-size: 0.85rem;
}

@media (max-width: 760px) {
  .hours-grid,
  .media-grid {
    grid-template-columns: 1fr;
  }
}
</style>
