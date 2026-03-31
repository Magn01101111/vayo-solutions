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
  number: number;
  title: string;
  description: string;
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
  name: string;
  location: string;
  deliveryTime: string;
  speed: 'fast' | 'mid';
}

export interface RelatedProduct {
  id: string;
  name: string;
  sku: string;
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
  imageUrl?: string;
  shortStatus: string;
  stockLabel: string;
  icon?: 'compressor' | 'fan' | 'valve' | 'sensor' | 'filter' | 'generic';
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
}
