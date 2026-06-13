import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService }   from './api.service';
import { API_CONFIG }   from '../config/api.config';
import { ApiCompany, ApiResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiService);

  getCompany(): Observable<ApiResponse<ApiCompany>> {
    return this.api.get<ApiResponse<ApiCompany>>(API_CONFIG.endpoints.company);
  }

  /**
   * Datos públicos de la empresa (IVA, contacto). No requiere sesión: lo usa el
   * front anónimo (carrito/cotización) para leer el IVA configurado sin caer en 401.
   */
  getPublicCompany(): Observable<ApiResponse<Partial<ApiCompany>>> {
    return this.api.get<ApiResponse<Partial<ApiCompany>>>(API_CONFIG.endpoints.companyPublic);
  }

  updateCompany(payload: Partial<ApiCompany>): Observable<ApiResponse<ApiCompany>> {
    return this.api.put<ApiResponse<ApiCompany>, Partial<ApiCompany>>(
      API_CONFIG.endpoints.company,
      payload,
    );
  }
}
