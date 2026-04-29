import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import {
  ApiCategory,
  ApiProductDetail,
  ApiProductListItem,
  ApiResponse,
  CreateProductPayload,
  UpdateProductPayload,
} from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);

  // ── Categories ────────────────────────────────────────────────────────────

  getCategories(all?: boolean): Observable<ApiResponse<ApiCategory[]>> {
    return this.api.get<ApiResponse<ApiCategory[]>>(
      API_CONFIG.endpoints.categories,
      all ? { all: 'true' } : undefined,
    );
  }

  getCategoryById(id: string): Observable<ApiResponse<ApiCategory>> {
    return this.api.get<ApiResponse<ApiCategory>>(
      `${API_CONFIG.endpoints.categories}/${id}`,
    );
  }

  createCategory(payload: { name: string; description?: string }): Observable<ApiResponse<ApiCategory>> {
    return this.api.post<ApiResponse<ApiCategory>, { name: string; description?: string }>(
      API_CONFIG.endpoints.categories,
      payload,
    );
  }

  updateCategory(id: string, payload: { name?: string; description?: string }): Observable<ApiResponse<ApiCategory>> {
    return this.api.put<ApiResponse<ApiCategory>, { name?: string; description?: string }>(
      `${API_CONFIG.endpoints.categories}/${id}`,
      payload,
    );
  }

  deactivateCategory(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.api.patch<ApiResponse<{ message: string }>, Record<string, never>>(
      `${API_CONFIG.endpoints.categories}/${id}/deactivate`,
      {},
    );
  }

  // ── Products ──────────────────────────────────────────────────────────────

  getProducts(
    category?: string,
    q?: string,
    all?: boolean,
  ): Observable<ApiResponse<ApiProductListItem[]>> {
    return this.api.get<ApiResponse<ApiProductListItem[]>>(
      API_CONFIG.endpoints.products,
      { category, q, all: all ? 'true' : undefined },
    );
  }

  getProductById(id: string): Observable<ApiResponse<ApiProductDetail>> {
    return this.api.get<ApiResponse<ApiProductDetail>>(
      `${API_CONFIG.endpoints.products}/${id}`,
    );
  }

  createProduct(payload: CreateProductPayload): Observable<ApiResponse<ApiProductDetail>> {
    return this.api.post<ApiResponse<ApiProductDetail>, CreateProductPayload>(
      API_CONFIG.endpoints.products,
      payload,
    );
  }

  updateProduct(id: string, payload: UpdateProductPayload): Observable<ApiResponse<ApiProductDetail>> {
    return this.api.put<ApiResponse<ApiProductDetail>, UpdateProductPayload>(
      `${API_CONFIG.endpoints.products}/${id}`,
      payload,
    );
  }

  deactivateProduct(id: string): Observable<ApiResponse<{ message: string; id: string }>> {
    return this.api.patch<ApiResponse<{ message: string; id: string }>, Record<string, never>>(
      `${API_CONFIG.endpoints.products}/${id}/deactivate`,
      {},
    );
  }

  uploadProductImage(id: string, file: File): Observable<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api.post<ApiResponse<{ imageUrl: string }>, FormData>(
      `${API_CONFIG.endpoints.products}/${id}/image`,
      formData,
    );
  }
}
