import { ProductCardData } from "./ui.models";

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
  description?: string;
  isActive: boolean;
}

export type ProductAvailabilityStatus =
  | 'in_stock'
  | 'out_of_stock'
  | 'on_request'
  | 'discontinued';

export type ProductIcon =
  | 'compressor'
  | 'fan'
  | 'valve'
  | 'sensor'
  | 'filter'
  | 'generic';

export interface ProductSpec {
  key?: string;
  label: string;
  value: string;
}

export interface ProductDimensions {
  heightMm?: number;
  widthMm?: number;
  lengthMm?: number;
  diameterMm?: number;
  netWeightKg?: number;
  grossWeightKg?: number;
}

export interface ProductDocument {
  title: string;
  type: 'pdf' | 'doc' | 'image' | 'other';
  sizeMb?: number;
  provider?: string;
  url?: string;
}

export interface ProductCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  sku: string;
  description?: string;
  brand: string;
  model?: string;
  price: number | null;
  currency: 'CLP';
  stock: number;
  availabilityStatus: ProductAvailabilityStatus;
  imageUrl?: string;
  isActive: boolean;
  tags: string[];
}

export interface ProductDetail extends Product {
  category: ProductCategoryRef;
  specs: ProductSpec[];
  dimensions?: ProductDimensions;
  compatibility: string[];
  documents: ProductDocument[];
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
export interface QuotationItem extends ProductCardData {
  qty: number;
}

export interface QuotationClient {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
}
