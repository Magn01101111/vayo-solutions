import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse, ApiSupplier, SupplierPayload } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly api = inject(ApiService);

  /** Lista proveedores. `all=true` (ADMIN) incluye inactivos. */
  getSuppliers(all?: boolean): Observable<ApiResponse<ApiSupplier[]>> {
    return this.api.get<ApiResponse<ApiSupplier[]>>(
      API_CONFIG.endpoints.suppliers,
      all ? { all: 'true' } : undefined,
    );
  }

  createSupplier(payload: SupplierPayload): Observable<ApiResponse<ApiSupplier>> {
    return this.api.post<ApiResponse<ApiSupplier>, SupplierPayload>(
      API_CONFIG.endpoints.suppliers,
      payload,
    );
  }

  updateSupplier(id: string, payload: Partial<SupplierPayload> & { isActive?: boolean }): Observable<ApiResponse<ApiSupplier>> {
    return this.api.put<ApiResponse<ApiSupplier>, Partial<SupplierPayload> & { isActive?: boolean }>(
      `${API_CONFIG.endpoints.suppliers}/${id}`,
      payload,
    );
  }

  deactivateSupplier(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.api.patch<ApiResponse<{ message: string }>, Record<string, never>>(
      `${API_CONFIG.endpoints.suppliers}/${id}/deactivate`,
      {},
    );
  }
}
