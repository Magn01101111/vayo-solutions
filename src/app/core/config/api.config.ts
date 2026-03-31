import { environment } from '../../../environment';

export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: {
    categories: 'categories',
    products: 'products',
    adminProducts: 'admin/products',
    auth: 'auth',
    clients: 'clients',
    quotes: 'quotes',
    sales: 'sales',
  },
} as const;
