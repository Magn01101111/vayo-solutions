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

  updateCompany(payload: Partial<ApiCompany>): Observable<ApiResponse<ApiCompany>> {
    return this.api.put<ApiResponse<ApiCompany>, Partial<ApiCompany>>(
      API_CONFIG.endpoints.company,
      payload,
    );
  }
}
