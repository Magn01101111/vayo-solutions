import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';
import type { UserRole } from '../constants/roles';

/**
 * Guard de roles. Uso en rutas:
 *   canActivate: [roleGuard]
 *   data: { roles: ['ADMIN', 'COTIZADOR'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data['roles'] ?? []) as UserRole[];

  if (!auth.isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  if (allowedRoles.length === 0 || auth.hasRole(...allowedRoles)) {
    return true;
  }

  // Autenticado pero sin el rol requerido → dashboard
  return router.createUrlTree(['/admin']);
};
