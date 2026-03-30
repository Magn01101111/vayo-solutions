import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductsComponent } from './pages/products/products.component';
import { QuotesComponent } from './pages/quotes/quotes.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { SalesComponent } from './pages/sales/sales.component';
import { ReportsComponent } from './pages/reports/reports.component';

export const ADMIN_ROUTES: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'productos', component: ProductsComponent },
  { path: 'cotizaciones', component: QuotesComponent },
  { path: 'clientes', component: ClientsComponent },
  { path: 'ventas', component: SalesComponent },
  { path: 'reportes', component: ReportsComponent },
];
