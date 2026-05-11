/**
 * Helpers de roles de usuario usados en autenticación y navegación.
 */
export const ROLE_CLIENTE = 'cliente'
export const ROLE_OWNER = 'owner'

export const isOwnerRole = (role = '') => String(role).toLowerCase() === ROLE_OWNER
export const isClientRole = (role = '') => String(role).toLowerCase() === ROLE_CLIENTE
