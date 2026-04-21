export const COUNTRY_OPTIONS = [
  { code: '+57', country: 'Colombia', minLength: 10, maxLength: 10 },
  { code: '+1', country: 'Estados Unidos / Canadá', minLength: 10, maxLength: 10 },
  { code: '+52', country: 'México', minLength: 10, maxLength: 10 },
  { code: '+34', country: 'España', minLength: 9, maxLength: 9 },
  { code: '+51', country: 'Perú', minLength: 9, maxLength: 9 },
  { code: '+58', country: 'Venezuela', minLength: 10, maxLength: 10 },
  { code: '+54', country: 'Argentina', minLength: 10, maxLength: 10 },
  { code: '+56', country: 'Chile', minLength: 9, maxLength: 9 },
  { code: '+593', country: 'Ecuador', minLength: 9, maxLength: 9 }
]

export const DEFAULT_COUNTRY_CODE = '+57'

const FALLBACK_RULE = {
  code: DEFAULT_COUNTRY_CODE,
  country: 'Colombia',
  minLength: 10,
  maxLength: 10
}

export const normalizeCountryCode = (countryCode) => {
  const digits = String(countryCode ?? '').replace(/\D/g, '')
  return digits ? `+${digits}` : DEFAULT_COUNTRY_CODE
}

export const normalizeLocalPhone = (phone) => {
  return String(phone ?? '').replace(/\D/g, '')
}

export const getPhoneRuleByCountryCode = (countryCode) => {
  const normalizedCode = normalizeCountryCode(countryCode)
  return COUNTRY_OPTIONS.find((option) => option.code === normalizedCode) ?? FALLBACK_RULE
}

export const getPhoneRequirementMessage = (countryCode) => {
  const rule = getPhoneRuleByCountryCode(countryCode)

  if (rule.minLength === rule.maxLength) {
    return `Debes ingresar exactamente ${rule.maxLength} dígitos`
  }

  return `Debes ingresar entre ${rule.minLength} y ${rule.maxLength} dígitos`
}

export const sanitizeLocalPhoneByCountry = (countryCode, localPhone) => {
  const digitsOnly = normalizeLocalPhone(localPhone)
  const rule = getPhoneRuleByCountryCode(countryCode)
  return digitsOnly.slice(0, rule.maxLength)
}

export const validateLocalPhoneByCountry = (countryCode, localPhone) => {
  const rule = getPhoneRuleByCountryCode(countryCode)
  const normalizedLocalPhone = sanitizeLocalPhoneByCountry(countryCode, localPhone)
  const length = normalizedLocalPhone.length

  if (!length) {
    return {
      isValid: false,
      message: 'Ingresa un número de teléfono válido'
    }
  }

  if (rule.minLength === rule.maxLength) {
    if (length !== rule.maxLength) {
      return {
        isValid: false,
        message: getPhoneRequirementMessage(countryCode)
      }
    }

    return {
      isValid: true,
      message: ''
    }
  }

  if (length < rule.minLength || length > rule.maxLength) {
    return {
      isValid: false,
      message: getPhoneRequirementMessage(countryCode)
    }
  }

  return {
    isValid: true,
    message: ''
  }
}

export const buildPhoneNumber = (countryCode, localPhone) => {
  const normalizedCode = normalizeCountryCode(countryCode)
  const normalizedLocalPhone = sanitizeLocalPhoneByCountry(countryCode, localPhone)

  if (!normalizedLocalPhone) return ''

  return `${normalizedCode}${normalizedLocalPhone}`
}

export const normalizeFullPhone = (phone) => {
  const value = String(phone ?? '').trim()
  if (!value) return ''

  const startsWithPlus = value.startsWith('+')
  const digits = value.replace(/\D/g, '')

  if (!digits) return ''

  return startsWithPlus ? `+${digits}` : `+${digits}`
}

export const splitPhoneNumber = (phone) => {
  const normalized = String(phone ?? '').replace(/[^\d+]/g, '')

  if (!normalized) {
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      localPhone: ''
    }
  }

  const normalizedPlus = normalized.startsWith('+') ? normalized : `+${normalized}`

  const sortedByLength = [...COUNTRY_OPTIONS].sort((a, b) => b.code.length - a.code.length)
  const matchedCountry = sortedByLength.find((option) => normalizedPlus.startsWith(option.code))

  if (matchedCountry) {
    return {
      countryCode: matchedCountry.code,
      localPhone: normalizeLocalPhone(normalizedPlus.slice(matchedCountry.code.length))
    }
  }

  return {
    countryCode: DEFAULT_COUNTRY_CODE,
    localPhone: normalizeLocalPhone(normalizedPlus.replace(/^\+/, ''))
  }
}
