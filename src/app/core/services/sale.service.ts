import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse } from '../models/api.models';

export type SaleStatus = 'pending' | 'paid' | 'cancelled';
export type SalePaymentMethod = 'cash' | 'transfer' | 'card' | 'credit' | 'other';

export interface ApiSale {
  id: string;
  folio: string;
  quoteId?: string | null;
  quoteFolio?: string;
  clientId?: string | null;
  client?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    taxId?: string;
  };
  items?: Array<{
    productId: string;
    name: string;
    sku?: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  totals?: {
    subtotal?: number;
    discount?: number;
    iva?: number;
    shipping?: number;
    total?: number;
  };
  coupon?: { code?: string; type?: string; value?: number; description?: string };
  currency?: string;
  paymentMethod?: SalePaymentMethod;
  status?: SaleStatus;
  notes?: string;
  /** Cotizador/admin que registró la venta (poblado). */
  createdBy?: { id: string; name: string } | string | null;
  createdByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly api = inject(ApiService);

  getSales(params?: { folio?: string; status?: SaleStatus; clientId?: string }): Observable<ApiResponse<ApiSale[]>> {
    return this.api.get<ApiResponse<ApiSale[]>>(API_CONFIG.endpoints.sales, params);
  }

  getSaleById(id: string): Observable<ApiResponse<ApiSale>> {
    return this.api.get<ApiResponse<ApiSale>>(`${API_CONFIG.endpoints.sales}/${id}`);
  }

  /** Convierte una cotización (por id) en venta. */
  createFromQuote(
    quoteId: string,
    payload?: { paymentMethod?: SalePaymentMethod; notes?: string },
  ): Observable<ApiResponse<ApiSale>> {
    return this.api.post<ApiResponse<ApiSale>, { paymentMethod?: SalePaymentMethod; notes?: string }>(
      `${API_CONFIG.endpoints.salesFromQuote}/${quoteId}`,
      payload ?? {},
    );
  }

  updateStatus(id: string, status: SaleStatus): Observable<ApiResponse<ApiSale>> {
    return this.api.patch<ApiResponse<ApiSale>, { status: SaleStatus }>(
      `${API_CONFIG.endpoints.sales}/${id}/status`,
      { status },
    );
  }
}
