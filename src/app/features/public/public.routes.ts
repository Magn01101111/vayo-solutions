import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CatalogComponent } from './pages/catalog/catalog.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { QuoteFlowComponent } from './pages/quote-flow/quote-flow.component';
import { ClientPortalComponent } from './pages/client-portal/client-portal.component';
import { TermsComponent } from './pages/legal/terms.component';
import { PrivacyComponent } from './pages/legal/privacy.component';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const PUBLIC_ROUTES: Routes = [
  { path: '', component: HomeComponent },
  { path: 'catalogo', component: CatalogComponent },
  { path: 'catalogo/:id', component: ProductDetailComponent },
  { path: 'cotizacion', component: QuoteFlowComponent },
  {
    path: 'portal-cliente',
    component: ClientPortalComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CLIENTE'] },
  },
  { path: 'terminos', component: TermsComponent },
  { path: 'privacidad', component: PrivacyComponent },
];
