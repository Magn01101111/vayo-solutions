export interface NavItem {
  label: string;
  route: string;
  exact?: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
  active?: boolean;
}

export interface StepItem {
  step?: number;
  number: number;
  title: string;
  description: string;
  label?: string;
}

export interface StepFlowItem {
  step: number;
  label: string;
}

export interface MetricItem {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  detail?: string;
}

export interface HeroPill {
  label: string;
}

export interface CatalogCategory {
  id: string;
  label: string;
  slug: string;
  active?: boolean;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductDocument {
  title: string;
  meta: string;
  url?: string;
}

export interface ProductReview {
  author: string;
  company?: string;
  date: string;
  rating: number;
  body: string;
  tags?: string[];
  verified?: boolean;
  initials: string;
}

export interface ProductProvider {
  id?: string;
  name: string;
  location: string;
  deliveryTime: string;
  speed: 'fast' | 'mid' | 'slow';
}

export interface RelatedProduct {
  id: string;
  name: string;
  sku: string;
  price: string;
  imageUrl?: string;
  shortStatus: string;
  category: string;
  icon?: 'compressor' | 'fan' | 'valve' | 'sensor' | 'filter' | 'generic';
}

export type ProductTab = 'specs' | 'dimensions' | 'compatibility' | 'documents';

export interface ProductTabItem {
  key: ProductTab;
  label: string;
}

export interface ProductCardData {
  id: string;
  category: string;
  categorySlug: string;
  name: string;
  sku: string;
  description?: string;
  price: string;
  /** URL de la imagen principal (compatibilidad). */
  imageUrl?: string;
  /** Galería completa — usada en la ficha de detalle. */
  images?: string[];
  shortStatus: string;
  stockLabel: string;
  icon?: 'compressor' | 'fan' | 'valve' | 'sensor' | 'filter' | 'generic';
  /** Producto destacado (home de ofertas). */
  isFeatured?: boolean;
  /** Precio de oferta vigente como string formateado. null = sin oferta. */
  offerPrice?: string | null;
  /** Precio de oferta numérico para cálculos. */
  offerPriceRaw?: number | null;
  /** Fecha de término de la oferta (ISO). */
  offerEndsAt?: string | null;
  /** Porcentaje de descuento calculado. */
  offerDiscountPercent?: number;
  tags: string[];
}

export interface ProductDetailData {
  id: string;
  category: string;
  categorySlug: string;
  name: string;
  sku: string;
  description?: string;
  price: string;
  imageUrl?: string;
  images?: string[];
  shortStatus: string;
  stockLabel: string;
  icon?: 'compressor' | 'fan' | 'valve' | 'sensor' | 'filter' | 'generic';
  brand: string;
  model?: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  specs: ProductSpec[];
  dimensions: {
    height?: string;
    width?: string;
    length?: string;
    diameter?: string;
    netWeight?: string;
    grossWeight?: string;
  };
  compatibility: string[];
  documents: ProductDocument[];
  /** Proveedores asignados al producto (vienen de la BD). */
  suppliers: ProductProvider[];
}
