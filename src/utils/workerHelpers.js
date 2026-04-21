const DEFAULT_WORKER_ROLE = 'Profesional'
const DEFAULT_WORKER_DESCRIPTION = 'Perfil profesional pendiente por completar.'
const DEFAULT_WORKER_RATING = 4.5
const DEFAULT_WORKER_EXPERIENCE = 0

const normalizeText = (value) => String(value ?? '').trim()

const normalizeStringList = (values) => {
  if (!Array.isArray(values)) return []

  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))]
}

const createValidationError = (code, message) => {
  const error = new Error(code)
  error.code = code
  error.userMessage = message
  return error
}

const parseOptionalNumber = (value, fallbackValue) => {
  if (value === '' || value === null || value === undefined) {
    return fallbackValue
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const resolveExplicitServices = (worker) => {
  if (Array.isArray(worker?.serviciosAsignados)) {
    return normalizeStringList(worker.serviciosAsignados)
  }

  if (Array.isArray(worker?.servicesAssigned)) {
    return normalizeStringList(worker.servicesAssigned)
  }

  return []
}

export const normalizeBusinessServices = (services) => normalizeStringList(services)

export const normalizeWorker = (worker, { fallbackBusinessId = '', fallbackServices = [] } = {}) => {
  const explicitServices = resolveExplicitServices(worker)
  const businessServices = normalizeBusinessServices(fallbackServices)
  const legacyProfile = explicitServices.length === 0

  const ratingValue = parseOptionalNumber(worker?.rating, DEFAULT_WORKER_RATING)
  const safeRating = Number.isFinite(ratingValue) ? Math.min(Math.max(ratingValue, 0), 5) : DEFAULT_WORKER_RATING

  const experienceValue = parseOptionalNumber(
    worker?.aniosExperiencia ?? worker?.yearsExperience,
    DEFAULT_WORKER_EXPERIENCE
  )
  const safeExperience = Number.isFinite(experienceValue)
    ? Math.max(0, Math.floor(experienceValue))
    : DEFAULT_WORKER_EXPERIENCE

  const rol = normalizeText(worker?.rol || worker?.especialidad || DEFAULT_WORKER_ROLE)

  return {
    id: normalizeText(worker?.id),
    nombre: normalizeText(worker?.nombre) || 'Trabajador sin nombre',
    rol: rol || DEFAULT_WORKER_ROLE,
    especialidad: rol || DEFAULT_WORKER_ROLE,
    descripcion: normalizeText(worker?.descripcion || worker?.description) || DEFAULT_WORKER_DESCRIPTION,
    rating: Math.round(safeRating * 10) / 10,
    aniosExperiencia: safeExperience,
    serviciosAsignados: explicitServices.length ? explicitServices : businessServices,
    activo: worker?.activo !== false,
    negocioId: normalizeText(worker?.negocioId || fallbackBusinessId),
    createdAt: worker?.createdAt ?? null,
    updatedAt: worker?.updatedAt ?? null,
    legacyProfile,
    supportsAllServices: legacyProfile && businessServices.length > 0
  }
}

export const buildWorkerPayload = (
  worker,
  { fallbackBusinessId = '', fallbackServices = [], requireServices = true } = {}
) => {
  const nombre = normalizeText(worker?.nombre)
  const negocioId = normalizeText(worker?.negocioId || fallbackBusinessId)
  const ratingValue = parseOptionalNumber(worker?.rating, DEFAULT_WORKER_RATING)
  const experienceValue = parseOptionalNumber(
    worker?.aniosExperiencia ?? worker?.yearsExperience,
    DEFAULT_WORKER_EXPERIENCE
  )
  const normalizedWorker = normalizeWorker(worker, { fallbackBusinessId, fallbackServices })

  if (!nombre) {
    throw createValidationError('staff_name_required', 'El nombre del trabajador es obligatorio.')
  }

  if (!negocioId) {
    throw createValidationError('business_id_required', 'El negocio asociado es obligatorio.')
  }

  if (!Number.isFinite(ratingValue) || ratingValue < 0 || ratingValue > 5) {
    throw createValidationError('staff_rating_invalid', 'La puntuación debe estar entre 0 y 5.')
  }

  if (!Number.isFinite(experienceValue) || experienceValue < 0) {
    throw createValidationError(
      'staff_experience_invalid',
      'Los años de experiencia no pueden ser negativos.'
    )
  }

  if (requireServices && normalizedWorker.serviciosAsignados.length === 0) {
    throw createValidationError(
      'staff_services_required',
      'Debes asignar al menos un servicio al trabajador.'
    )
  }

  return {
    nombre,
    rol: normalizedWorker.rol,
    especialidad: normalizedWorker.rol,
    descripcion: normalizedWorker.descripcion,
    rating: Math.round(ratingValue * 10) / 10,
    aniosExperiencia: Math.floor(experienceValue),
    serviciosAsignados: normalizedWorker.serviciosAsignados,
    activo: Boolean(worker?.activo ?? normalizedWorker.activo),
    negocioId
  }
}

export const workerCanPerformService = (worker, serviceName) => {
  const normalizedService = normalizeText(serviceName).toLowerCase()

  if (!normalizedService) return false

  const normalizedWorker = normalizeWorker(worker)

  if (normalizedWorker.supportsAllServices) {
    return true
  }

  return normalizedWorker.serviciosAsignados.some(
    (service) => normalizeText(service).toLowerCase() === normalizedService
  )
}

export const filterWorkersByService = (workers, serviceName) => {
  const normalizedService = normalizeText(serviceName)

  return workers
    .map((worker) => normalizeWorker(worker))
    .filter((worker) => worker.activo)
    .filter((worker) => (normalizedService ? workerCanPerformService(worker, normalizedService) : false))
    .sort((first, second) => {
      if (first.rating !== second.rating) return second.rating - first.rating
      if (first.aniosExperiencia !== second.aniosExperiencia) {
        return second.aniosExperiencia - first.aniosExperiencia
      }
      return first.nombre.localeCompare(second.nombre, 'es', { sensitivity: 'base' })
    })
}

export const formatWorkerRating = (rating) => `${Number(rating ?? 0).toFixed(1)} / 5`

export const formatWorkerExperience = (years) => {
  const safeYears = Math.max(0, Number(years ?? 0))
  return safeYears === 1 ? '1 año de experiencia' : `${safeYears} años de experiencia`
}
