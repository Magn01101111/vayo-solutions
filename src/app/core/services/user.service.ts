import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService }   from './api.service';
import { API_CONFIG }   from '../config/api.config';
import type { UserRole } from '../constants/roles';
import {
  ApiUser,
  ApiResponse,
  CreateUserPayload,
  UpdateUserPayload,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  getUsers(role?: UserRole): Observable<ApiResponse<ApiUser[]>> {
    return this.api.get<ApiResponse<ApiUser[]>>(
      API_CONFIG.endpoints.users,
      role ? { role } : undefined,
    );
  }

  getUserById(id: string): Observable<ApiResponse<ApiUser>> {
    return this.api.get<ApiResponse<ApiUser>>(
      `${API_CONFIG.endpoints.users}/${id}`,
    );
  }

  // ── Cotizadores ───────────────────────────────────────────────────────────

  createCotizador(payload: CreateUserPayload): Observable<ApiResponse<ApiUser>> {
    return this.api.post<ApiResponse<ApiUser>, CreateUserPayload>(
      API_CONFIG.endpoints.cotizadores,
      payload,
    );
  }

  updateCotizador(id: string, payload: UpdateUserPayload): Observable<ApiResponse<ApiUser>> {
    return this.api.put<ApiResponse<ApiUser>, UpdateUserPayload>(
      `${API_CONFIG.endpoints.cotizadores}/${id}`,
      payload,
    );
  }

  deactivateCotizador(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.api.patch<ApiResponse<{ message: string }>, Record<string, never>>(
      `${API_CONFIG.endpoints.cotizadores}/${id}/deactivate`,
      {},
    );
  }

  // ── Proveedores ───────────────────────────────────────────────────────────

  createProveedor(payload: CreateUserPayload): Observable<ApiResponse<ApiUser>> {
    return this.api.post<ApiResponse<ApiUser>, CreateUserPayload>(
      API_CONFIG.endpoints.proveedores,
      payload,
    );
  }

  updateProveedor(id: string, payload: UpdateUserPayload): Observable<ApiResponse<ApiUser>> {
    return this.api.put<ApiResponse<ApiUser>, UpdateUserPayload>(
      `${API_CONFIG.endpoints.proveedores}/${id}`,
      payload,
    );
  }

  deactivateProveedor(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.api.patch<ApiResponse<{ message: string }>, Record<string, never>>(
      `${API_CONFIG.endpoints.proveedores}/${id}/deactivate`,
      {},
    );
  }

  // NOTA: La gestión de CLIENTEs vive en ClientService porque un CLIENTE es
  // ante todo una entidad CRM. Su cuenta de portal es opcional.
}
