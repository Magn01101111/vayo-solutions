import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { ROLES } from '../constants/roles';

/**
 * Guard del portal público (PublicShell).
 *
 * Regla de negocio:
 *   - El ADMIN NO debe navegar el sitio público (catálogo, cotización, etc.).
 *     Su lugar es el panel de administración. Si intenta entrar, se le redirige
 *     a /admin.
 *   - El COTIZADOR SÍ puede entrar: necesita el portal público para hacer
 *     "venta asistida" a un cliente.
 *   - PROVEEDOR, CLIENTE y visitantes anónimos: acceso libre al portal.
 */
export const publicShellGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Solo el ADMIN queda bloqueado del portal público.
  if (auth.isAuthenticated && auth.hasRole(ROLES.ADMIN)) {
    return router.createUrlTree(['/admin']);
  }

  return true;
};
