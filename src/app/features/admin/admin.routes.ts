import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

import { DashboardComponent }   from './pages/dashboard/dashboard.component';
import { ProductsComponent }    from './pages/products/products.component';
import { CategoriesComponent }  from './pages/categories/categories.component';
import { QuotesComponent }      from './pages/quotes/quotes.component';
import { ClientsComponent }     from './pages/clients/clients.component';
import { UsersComponent }       from './pages/users/users.component';
import { SalesComponent }       from './pages/sales/sales.component';
import { ReportsComponent }     from './pages/reports/reports.component';
import { SettingsComponent }    from './pages/settings/settings.component';

export const ADMIN_ROUTES: Routes = [
  { path: '',             component: DashboardComponent },
  { path: 'productos',    component: ProductsComponent },
  { path: 'categorias',   component: CategoriesComponent },
  { path: 'cotizaciones', component: QuotesComponent },
  { path: 'clientes',     component: ClientsComponent },
  {
    path: 'usuarios',
    component: UsersComponent,
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
  },
  { path: 'ventas',       component: SalesComponent },
  { path: 'reportes',     component: ReportsComponent },
  {
    path: 'configuracion',
    component: SettingsComponent,
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
  },
];
