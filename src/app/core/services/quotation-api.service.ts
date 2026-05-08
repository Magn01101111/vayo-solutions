import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse } from '../models/api.models';
import { Observable } from 'rxjs';

export interface ApiQuote {
  _id: string;
  folio: string;
  clientId?: string | null;
  client?: { name?: string; email?: string; phone?: string };
  items?: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  totals?: { subtotal?: number; iva?: number; total?: number };
  metadata?: { status?: 'sent' | 'accepted' | 'rejected' };
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class QuotationApiService {
  private api = inject(ApiService);

  createQuote(payload: any): Observable<any> {
    return this.api.post(API_CONFIG.endpoints.quotes, payload);
  }

  /** Lista cotizaciones con filtros opcionales (folio, clientId, status). */
  getQuotes(params?: { folio?: string; clientId?: string; status?: string }): Observable<ApiResponse<ApiQuote[]>> {
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

  downloadPDF(id: string) {
    return this.api.getBlob(`${API_CONFIG.endpoints.quotes}/${id}/pdf`);
  }
}
