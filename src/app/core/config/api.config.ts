import { environment } from '../../../environment';

export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: {
    // Auth
    auth: 'auth',
    login: 'auth/login',
    logout: 'auth/logout',
    me: 'auth/me',
    changePassword: 'auth/me/password',
    passwordResetRequest: 'auth/password-reset/request',
    passwordResetConfirm: 'auth/password-reset/confirm',

    // Catalog (public)
    categories: 'categories',
    products: 'products',

    // Clients
    clients: 'clients',

    // Users
    users: 'users',
    cotizadores: 'users/cotizadores',
    proveedores: 'users/proveedores',

    // Company
    company: 'company',

    // Quotes / Sales (Sprint 3+)
    quotes: 'quotes',
    sales: 'sales',
  },
} as const;
