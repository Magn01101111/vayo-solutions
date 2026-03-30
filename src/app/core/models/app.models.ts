export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  businessType?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  category: string;
  name: string;
  sku: string;
  description?: string;
  price?: string | number | null;
  imageUrl?: string;
  inStock?: boolean;
  icon?: 'compressor' | 'fan' | 'valve' | 'sensor' | 'filter' | 'generic';
}

export interface QuoteItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice?: number | null;
}

export interface Quote {
  id: string;
  clientId?: string;
  clientName: string;
  items: QuoteItem[];
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdAt: string;
  notes?: string;
}

export interface Sale {
  id: string;
  clientId: string;
  quoteId?: string;
  total: number;
  createdAt: string;
}
