/**
 * Roles del sistema VAYO — fuente única de verdad en el frontend.
 * El backend define los mismos valores en `src/constants/roles.js`.
 *
 * Usar siempre ROLES.ADMIN, ROLES.COTIZADOR, etc.
 * Nunca comparar con strings literales como 'ADMIN' directamente.
 */
export const ROLES = {
  ADMIN:     'ADMIN',
  COTIZADOR: 'COTIZADOR',
  PROVEEDOR: 'PROVEEDOR',
  CLIENTE:   'CLIENTE',
} as const;

/** Tipo derivado del objeto constante → 'ADMIN' | 'COTIZADOR' | 'PROVEEDOR' | 'CLIENTE' */
export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/** Etiquetas de display en español para cada rol */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:     'Administrador',
  COTIZADOR: 'Cotizador',
  PROVEEDOR: 'Proveedor',
  CLIENTE:   'Cliente',
};

/** Ruta de redirección post-login por rol */
export const ROLE_REDIRECTS: Record<UserRole, string> = {
  ADMIN:     '/admin',
  COTIZADOR: '/admin',      // Sprint 3: mover a /cotizador
  PROVEEDOR: '/admin',      // Sprint 3: mover a /proveedor
  CLIENTE:   '/catalogo',   // Portal público — navega el catálogo con cuenta
};
