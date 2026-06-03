import { Routes } from '@angular/router';
import { PublicShellComponent } from './layouts/public-shell/public-shell.component';
import { AdminShellComponent }  from './layouts/admin-shell/admin-shell.component';
import { authGuard }            from './core/guards/auth.guard';
import { roleGuard }            from './core/guards/role.guard';
import { publicShellGuard }     from './core/guards/public-shell.guard';

export const routes: Routes = [
  // ── Autenticación ─────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar sesión — VAYO',
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'Crear cuenta — VAYO',
  },
  {
    path: 'recuperar-contrasena',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
    title: 'Recuperar contraseña — VAYO',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
    title: 'Nueva contraseña — VAYO',
  },

  // ── Portal público ────────────────────────────────────────────────────────
  // publicShellGuard: el ADMIN no puede navegar el portal (se va a /admin).
  // Cotizador, proveedor, cliente y visitantes anónimos sí pueden.
  {
    path: '',
    component: PublicShellComponent,
    canActivate: [publicShellGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/public/public.routes').then((m) => m.PUBLIC_ROUTES),
      },
    ],
  },

  // ── Panel de administración (protegido) ───────────────────────────────────
  // authGuard: requiere sesión. roleGuard: solo personal interno (no CLIENTE).
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'COTIZADOR', 'PROVEEDOR'] },
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },

  // ── Wildcard ──────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '',
  },
];
