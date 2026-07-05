import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse } from '../models/api.models';
import { Observable } from 'rxjs';

export type QuoteSource = 'client' | 'guest' | 'assisted';

export interface ApiQuote {
  _id: string;
  folio: string;
  clientId?: string | null;
  /** Cotizador que la creó (poblado). null = autogestión del cliente/invitado. */
  createdBy?: { id: string; name: string; email?: string } | string | null;
  createdByName?: string | null;
  /** Origen: cliente con cuenta, invitado, o venta asistida por cotizador. */
  source?: QuoteSource;
  client?: { name?: string; email?: string; phone?: string };
  items?: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  totals?: { subtotal?: number; discount?: number; iva?: number; shipping?: number; total?: number };
  coupon?: { code?: string; type?: string; value?: number; description?: string };
  manualDiscount?: { amount?: number; reason?: string; appliedBy?: string | null; appliedAt?: string | null };
  shipping?: { methodId?: string; methodLabel?: string; estimatedDays?: string; cost?: number };
  paymentTerms?: 'contado' | '15-dias' | '30-dias' | '60-dias' | '90-dias';
  deliveryTerms?: 'pickup' | 'delivery' | 'shipping';
  billingAddress?: { street?: string; number?: string; apt?: string; city?: string; region?: string; zip?: string; reference?: string };
  shippingAddress?: { street?: string; number?: string; apt?: string; city?: string; region?: string; zip?: string; reference?: string };
  shippingSameAsBilling?: boolean;
  metadata?: { status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' };
  viewedAt?: string | null;
  createdAt?: string;
}

export type QuoteStatus = 'sent' | 'accepted' | 'rejected' | 'expired';

@Injectable({ providedIn: 'root' })
export class QuotationApiService {
  private api = inject(ApiService);

  createQuote(payload: any): Observable<any> {
    return this.api.post(API_CONFIG.endpoints.quotes, payload);
  }

  /** Lista cotizaciones con filtros opcionales (folio, clientId, status). */
  getQuotes(params?: { folio?: string; clientId?: string; status?: string; mine?: string; createdBy?: string; source?: string }): Observable<ApiResponse<ApiQuote[]>> {
    return this.api.get<ApiResponse<ApiQuote[]>>(API_CONFIG.endpoints.quotes, params);
  }

  /** Búsqueda directa por número de folio. */
  getQuoteByFolio(folio: string): Observable<ApiResponse<ApiQuote>> {
    return this.api.get<ApiResponse<ApiQuote>>(
      `${API_CONFIG.endpoints.quotes}/folio/${folio}`,
    );
  }

  getQuoteById(id: string): Observable<ApiResponse<ApiQuote>> {
    return this.api.get<ApiResponse<ApiQuote>>(`${API_CONFIG.endpoints.quotes}/${id}`);
  }

  /** Cambia el estado de una cotización (ADMIN/COTIZADOR). */
  updateStatus(id: string, status: QuoteStatus): Observable<ApiResponse<ApiQuote>> {
    return this.api.patch<ApiResponse<ApiQuote>, { status: QuoteStatus }>(
      `${API_CONFIG.endpoints.quotes}/${id}/status`,
      { status },
    );
  }

  updateCommercialTerms(
    id: string,
    payload: {
      discount?: number;
      reason?: string;
      paymentTerms?: ApiQuote['paymentTerms'];
      deliveryTerms?: ApiQuote['deliveryTerms'];
      shipping?: ApiQuote['shipping'];
    },
  ): Observable<ApiResponse<ApiQuote>> {
    return this.api.patch<ApiResponse<ApiQuote>, typeof payload>(
      `${API_CONFIG.endpoints.quotes}/${id}/commercial-terms`,
      payload,
    );
  }

  /** Envía la cotización por correo con el PDF adjunto. */
  sendByEmail(id: string, to?: string): Observable<ApiResponse<{ message: string; simulated?: boolean }>> {
    return this.api.post<ApiResponse<{ message: string; simulated?: boolean }>, { to?: string }>(
      `${API_CONFIG.endpoints.quotes}/${id}/send-email`,
      to ? { to } : {},
    );
  }

  /**
   * Descarga el PDF de una cotización.
   * Si recibe `token`, lo agrega como `?token=` para autorizar el flujo público
   * (cotizaciones generadas sin sesión iniciada).
   */
  downloadPDF(id: string, token?: string | null) {
    const path = token
      ? `${API_CONFIG.endpoints.quotes}/${id}/pdf?token=${encodeURIComponent(token)}`
      : `${API_CONFIG.endpoints.quotes}/${id}/pdf`;
    return this.api.getBlob(path);
  }

  duplicateQuote(id: string): Observable<ApiResponse<ApiQuote>> {
    return this.api.post<ApiResponse<ApiQuote>>(`${API_CONFIG.endpoints.quotes}/${id}/duplicate`, {});
  }

  /** Marca la cotización como vista por el cliente (primera apertura). */
  markViewed(id: string): Observable<ApiResponse<{ viewedAt: string }>> {
    return this.api.patch<ApiResponse<{ viewedAt: string }>, object>(
      `${API_CONFIG.endpoints.quotes}/${id}/mark-viewed`,
      {},
    );
  }
}
