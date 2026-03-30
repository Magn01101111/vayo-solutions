import { Routes } from '@angular/router';
import { PublicShellComponent } from './layouts/public-shell/public-shell.component';
import { AdminShellComponent } from './layouts/admin-shell/admin-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicShellComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/public/public.routes').then((m) => m.PUBLIC_ROUTES),
      },
    ],
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
