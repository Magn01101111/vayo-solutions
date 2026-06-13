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

export interface ApiProductImage {
  url: string;
  publicId?: string | null;
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
  /** Galería de imágenes — `[0]` es la principal. Hasta 4. */
  images?: ApiProductImage[];
  /** @deprecated Usar `images[0].url`. Se mantiene por compatibilidad. */
  imageUrl?: string;
  /** @deprecated Usar `images[0].publicId`. Se mantiene por compatibilidad. */
  imagePublicId?: string | null;
  isActive: boolean;
  /** Producto destacado: aparece en el home de ofertas. */
  isFeatured?: boolean;
  /** Precio de oferta vigente (null = sin oferta). */
  offerPrice?: number | null;
  /** Inicio de vigencia de la oferta. */
  offerStartsAt?: string | null;
  /** Término de vigencia de la oferta. */
  offerEndsAt?: string | null;
  tags: string[];
}

export interface ApiBanner {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
  order: number;
  isActive: boolean;
}

export interface ApiFavorite {
  _id?: string;
  productId: string;
}

export interface ApiProductSupplier {
  id: string;
  name?: string;
  location?: string;
  deliveryTime: string;
  speed: 'fast' | 'mid' | 'slow';
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
  suppliers?: ApiProductSupplier[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Suppliers (catálogo global) ────────────────────────────────────────────────
export interface ApiSupplier {
  id: string;
  name: string;
  location?: string;
  email?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface SupplierPayload {
  name: string;
  location?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

// ── Reviews ────────────────────────────────────────────────────────────────────
export type ApiReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ApiReview {
  id: string;
  productId: string;
  authorName: string;
  authorCompany?: string;
  rating: number;
  body: string;
  tags: string[];
  verified: boolean;
  status: ApiReviewStatus;
  createdAt?: string;
  /** Solo presente en el listado admin. */
  product?: { id: string; name: string; sku: string } | null;
}

export interface ApiReviewSummary {
  count: number;
  average: number;
}

export interface CreateReviewPayload {
  rating: number;
  body: string;
  tags?: string[];
  authorCompany?: string;
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
  /** Hasta 4 imágenes. La primera es la principal. */
  images?: ApiProductImage[];
  /** @deprecated mantener solo legacy. Si va `images[]` no usar esto. */
  imageUrl?: string;
  imagePublicId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  specs?: ApiProductSpec[];
  dimensions?: ApiProductDimensions;
  compatibility?: string[];
  documents?: ApiProductDocument[];
  /** Proveedores asignados: ref al Supplier + tiempo de entrega. */
  suppliers?: { supplier: string; deliveryTime?: string; speed?: 'fast' | 'mid' | 'slow' }[];
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

export type UpdateClientPayload = Partial<CreateClientPayload> & { isActive?: boolean };

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

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'password'>> & { isActive?: boolean };

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
