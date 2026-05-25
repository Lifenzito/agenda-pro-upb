/**
 * Utilidad para guardar y leer negocios visitados recientemente en localStorage.
 */
const STORAGE_KEY = 'agendapro_recent_businesses'
const MAX_ENTRIES = 10

const readStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeStore = (entries) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* localStorage full or unavailable */
  }
}

export const saveRecentBusiness = ({ slug, nombre, fotoPerfilURL = '' }) => {
  if (!slug) return

  const entries = readStore().filter((entry) => entry.slug !== slug)

  entries.unshift({
    slug,
    nombre: String(nombre ?? '').trim(),
    fotoPerfilURL: String(fotoPerfilURL ?? '').trim(),
    visitedAt: Date.now()
  })

  writeStore(entries.slice(0, MAX_ENTRIES))
}

export const getRecentBusinesses = () => readStore()

export const clearRecentBusinesses = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}
