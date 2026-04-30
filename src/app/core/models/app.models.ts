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
}

export interface QuotationClient {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
}

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
