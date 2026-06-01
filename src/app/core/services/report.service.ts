import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

export type ReportType = 'sales' | 'quotes' | 'clients';

export interface ReportFilters {
  from?: string;   // YYYY-MM-DD
  to?: string;     // YYYY-MM-DD
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiService);

  private endpointFor(type: ReportType): string {
    switch (type) {
      case 'sales':   return API_CONFIG.endpoints.reportSales;
      case 'quotes':  return API_CONFIG.endpoints.reportQuotes;
      case 'clients': return API_CONFIG.endpoints.reportClients;
    }
  }

  /** Construye el query string a partir de los filtros. */
  private buildQuery(filters: ReportFilters, format?: 'csv'): string {
    const params = new URLSearchParams();
    if (filters.from)   params.set('from', filters.from);
    if (filters.to)     params.set('to', filters.to);
    if (filters.status) params.set('status', filters.status);
    if (format)         params.set('format', format);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  /** Vista previa JSON (para mostrar conteo/total antes de exportar). */
  preview(type: ReportType, filters: ReportFilters): Observable<any> {
    return this.api.get<any>(`${this.endpointFor(type)}${this.buildQuery(filters)}`);
  }

  /** Descarga el CSV como blob. */
  downloadCSV(type: ReportType, filters: ReportFilters): Observable<Blob> {
    return this.api.getBlob(`${this.endpointFor(type)}${this.buildQuery(filters, 'csv')}`);
  }
}
