import type { UserRole } from '../constants/roles';

// ── Products ─────────────────────────────────────────────────────────────────

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
  categoryId?: string;
  categoryName?: string;
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
  /** public_id de Cloudinary — necesario para limpiar al reemplazar */
  imagePublicId?: string | null;
  isActive: boolean;
  tags: string[];
}

export interface ApiProductDetail extends ApiProductListItem {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  specs: ApiProductSpec[];
  dimensions?: ApiProductDimensions;
  compatibility: string[];
  documents: ApiProductDocument[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  categoryId: string;
  name: string;
  sku: string;
  description?: string;
  brand: string;
  model?: string;
  price: number | null;
  currency?: 'CLP';
  stock: number;
  availabilityStatus: ApiProductAvailabilityStatus;
  imageUrl?: string;
  imagePublicId?: string | null;
  isActive?: boolean;
  tags?: string[];
  specs?: ApiProductSpec[];
  dimensions?: ApiProductDimensions;
  compatibility?: string[];
  documents?: ApiProductDocument[];
}

export type UpdateProductPayload = Partial<Omit<CreateProductPayload, 'sku'>>;

// ── Upload ────────────────────────────────────────────────────────────────────

export interface UploadResponse {
  url: string;
  publicId: string;
}

// ── Clients ───────────────────────────────────────────────────────────────────

export interface ApiClient {
  id: string;
  name: string;
  company?: string;
  rut?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdBy?: { id: string; name: string; email: string } | string | null;
  /** Resumen de la cuenta de portal vinculada (null si no tiene) */
  portalAccount?: {
    id: string;
    email?: string;
    isActive?: boolean;
  } | null;
  /** Flag conveniente: true si el cliente tiene cuenta de portal */
  hasPortalAccount?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvitePortalPayload {
  password: string;
}

export interface InvitePortalResponse {
  message: string;
  portalAccount: {
    id: string;
    email: string;
    isActive: boolean;
  };
}

export interface CreateClientPayload {
  name: string;
  company?: string;
  rut?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;

// ── Users ─────────────────────────────────────────────────────────────────────

/**
 * @deprecated Usar UserRole importado desde core/constants/roles.ts
 * Mantenido como alias para no romper imports existentes.
 */
export type ApiUserRole = UserRole;

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  role: UserRole;
  isActive: boolean;
  profileImage?: string;
  createdAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  position?: string;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'password'>>;

// ── Company ───────────────────────────────────────────────────────────────────

export interface ApiCompany {
  id?: string;
  name: string;
  rut?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  ivaPercent: number;
  invoiceTerms?: string;
}

// ── API Response wrappers ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiPaginatedResponse<T> {
  ok: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
  errors?: { field: string; message: string }[];
}
