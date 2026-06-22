/**
 * Modelos de dominio locales (no directamente mapeados a la API).
 *
 * Tipos relacionados con la API están en api.models.ts.
 * Tipos de UI están en ui.models.ts.
 * Tipos de autenticación están en auth.models.ts.
 */
import { ProductCardData } from './ui.models';

// ── Flujo de cotización (estado local en cliente) ─────────────────────────────

export interface QuotationItem extends ProductCardData {
  qty: number;
  /** Notas del cliente sobre este ítem (especificaciones, urgencia, etc). */
  notes?: string;
  /** Cantidad máxima permitida (derivada del stock o reglas comerciales). */
  maxQty?: number;
  /** Marca de tiempo cuando se agregó al carrito (ISO). */
  addedAt?: string;
}

export interface SavedItem extends ProductCardData {
  savedAt: string;
}

export interface QuotationAddress {
  street?: string;
  number?: string;
  apt?: string;
  city?: string;
  region?: string;
  zip?: string;
  reference?: string;
}

export type CustomerType = 'person' | 'company';

export interface QuotationClient {
  /** Tipo de cliente: persona natural o empresa. */
  customerType?: CustomerType;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  /** RUT (persona) o RUT empresa, formato chileno con DV. */
  taxId?: string;
  /** Giro (sólo empresa). */
  businessActivity?: string;
  /** Dirección de facturación. */
  billingAddress?: QuotationAddress;
  /** Dirección de envío (puede ser igual a la de facturación). */
  shippingAddress?: QuotationAddress;
  /** Si el envío es el mismo que la facturación. */
  shippingSameAsBilling?: boolean;
  notes?: string;
  /** Aceptación de términos y condiciones. */
  acceptsTerms?: boolean;
  /** Marketing opt-in. */
  acceptsMarketing?: boolean;
}

export type CouponType = 'percentage' | 'fixed';

export interface Coupon {
  code: string;
  type: CouponType;
  /** Si es percentage, 0-100. Si es fixed, monto en CLP. */
  value: number;
  /** Monto mínimo de subtotal para aplicar. */
  minSubtotal?: number;
  /** Descripción legible. */
  description?: string;
  /** Descuento calculado en CLP. */
  discount?: number;
}

export interface ShippingMethod {
  id: string;
  label: string;
  description?: string;
  cost: number;
  estimatedDays?: string;
}

export type QuotationCurrency = 'CLP' | 'USD' | 'UF';

export type PaymentTerms = 'contado' | '15-dias' | '30-dias' | '60-dias';

export type DeliveryTerms = 'pickup' | 'delivery' | 'shipping';

// ── Entidades de dominio (usadas antes de conectar con API — Sprint 3) ─────────

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

export interface MyCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  validUntil: string | null;
  origin: 'welcome' | 'scan' | 'admin' | 'promo';
  minSubtotal?: number;
}

export interface AppNotification {
  id: string;
  type: 'new_quote' | 'low_stock' | 'new_review' | 'new_client';
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}
