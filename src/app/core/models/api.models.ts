export type ApiProductAvailabilityStatus =
  | 'in_stock'
  | 'out_of_stock'
  | 'on_request'
  | 'discontinued';

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface ApiProductSpec {
  key?: string;
  label: string;
  value: string;
}

export interface ApiProductDimensions {
  heightMm?: number;
  widthMm?: number;
  lengthMm?: number;
  diameterMm?: number;
  netWeightKg?: number;
  grossWeightKg?: number;
}

export interface ApiProductDocument {
  title: string;
  type: 'pdf' | 'doc' | 'image' | 'other';
  sizeMb?: number;
  provider?: string;
  url?: string;
}

export interface ApiProductListItem {
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
  availabilityStatus: ApiProductAvailabilityStatus;
  imageUrl?: string;
  isActive: boolean;
  tags: string[];
}

export interface ApiProductDetail {
  id: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  name: string;
  sku: string;
  description?: string;
  brand: string;
  model?: string;
  price: number | null;
  currency: 'CLP';
  stock: number;
  availabilityStatus: ApiProductAvailabilityStatus;
  imageUrl?: string;
  isActive: boolean;
  tags: string[];
  specs: ApiProductSpec[];
  dimensions?: ApiProductDimensions;
  compatibility: string[];
  documents: ApiProductDocument[];
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export interface ApiPaginatedResponse<T> {
  ok: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
}

export interface CreateProductPayload {
  categoryId: string;
  name: string;
  sku: string;
  description?: string;
  brand: string;
  model?: string;
  price: number | null;
  currency: 'CLP';
  stock: number;
  availabilityStatus: 'in_stock' | 'out_of_stock' | 'on_request' | 'discontinued';
  imageUrl?: string;
  isActive: boolean;
  tags: string[];
  specs: ApiProductSpec[];
  dimensions?: ApiProductDimensions;
  compatibility: string[];
  documents: ApiProductDocument[];
}
