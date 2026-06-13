import { environment } from '../../../environment';

export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: {
    // Auth
    auth:     'auth',
    register: 'auth/register',
    login:    'auth/login',
    logout: 'auth/logout',
    me: 'auth/me',
    changePassword: 'auth/me/password',
    mePhoto: 'auth/me/photo',
    passwordResetRequest: 'auth/password-reset/request',
    passwordResetConfirm: 'auth/password-reset/confirm',

    // Catalog (public)
    categories: 'categories',
    products: 'products',

    // Upload (Cloudinary)
    uploadProduct: 'upload/product',

    // Clients
    clients: 'clients',

    // Users (solo personal interno: cotizadores y proveedores)
    users:       'users',
    cotizadores: 'users/cotizadores',
    proveedores: 'users/proveedores',

    // Company
    company: 'company',
    companyPublic: 'company/public',

    // Quotes / Sales (Sprint 3+)
    quotes: 'quotes',
    sales:  'sales',
    salesFromQuote: 'sales/from-quote',

    // Stats
    statsDashboard: 'stats/dashboard',

    // Reports
    reportSales:   'reports/sales',
    reportQuotes:  'reports/quotes',
    reportClients: 'reports/clients',

    // Suppliers (proveedores de catálogo)
    suppliers: 'suppliers',

    // Reviews (reseñas de productos)
    reviews: 'reviews',

    // Coupons
    coupons: 'coupons',
    couponsValidate: 'coupons/validate',

    // Favorites
    favorites: 'favorites',

    // Banners
    banners: 'banners',
  },
} as const;
