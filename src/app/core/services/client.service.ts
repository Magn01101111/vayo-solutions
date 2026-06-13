import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import {
  ApiClient,
  ApiResponse,
  CreateClientPayload,
  UpdateClientPayload,
  InvitePortalPayload,
  InvitePortalResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly api = inject(ApiService);

  getClients(params?: { q?: string; active?: 'true' | 'false' | 'all'; mine?: string }): Observable<ApiResponse<ApiClient[]>> {
    return this.api.get<ApiResponse<ApiClient[]>>(
      API_CONFIG.endpoints.clients,
      params,
    );
  }

  getClientById(id: string): Observable<ApiResponse<ApiClient>> {
    return this.api.get<ApiResponse<ApiClient>>(
      `${API_CONFIG.endpoints.clients}/${id}`,
    );
  }

  createClient(payload: CreateClientPayload): Observable<ApiResponse<ApiClient>> {
    return this.api.post<ApiResponse<ApiClient>, CreateClientPayload>(
      API_CONFIG.endpoints.clients,
      payload,
    );
  }

  updateClient(id: string, payload: UpdateClientPayload): Observable<ApiResponse<ApiClient>> {
    return this.api.put<ApiResponse<ApiClient>, UpdateClientPayload>(
      `${API_CONFIG.endpoints.clients}/${id}`,
      payload,
    );
  }

  deactivateClient(id: string): Observable<ApiResponse<{ message: string; id: string }>> {
    return this.api.patch<ApiResponse<{ message: string; id: string }>, Record<string, never>>(
      `${API_CONFIG.endpoints.clients}/${id}/deactivate`,
      {},
    );
  }

  // ── Portal de cliente ─────────────────────────────────────────────────────
  // Crea una cuenta de portal (User[CLIENTE]) para un Client CRM existente.
  inviteToPortal(id: string, payload: InvitePortalPayload): Observable<ApiResponse<InvitePortalResponse>> {
    return this.api.post<ApiResponse<InvitePortalResponse>, InvitePortalPayload>(
      `${API_CONFIG.endpoints.clients}/${id}/invite`,
      payload,
    );
  }

  // Revoca el acceso al portal: elimina solo el User, el Client CRM permanece.
  revokePortalAccess(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.api.delete<ApiResponse<{ message: string }>>(
      `${API_CONFIG.endpoints.clients}/${id}/portal-access`,
    );
  }
}
