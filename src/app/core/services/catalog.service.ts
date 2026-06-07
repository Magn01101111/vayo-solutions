import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import {
  ApiCategory,
  ApiProductDetail,
  ApiProductListItem,
  ApiResponse,
  CreateProductPayload,
  UpdateProductPayload,
} from '../models/api.models';
import { ApiService }   from './api.service';
import { CacheService } from './cache.service';

// ── TTL por tipo de recurso (en milisegundos) ──────────────────────────────
// Los productos cambian con frecuencia en un negocio activo, así que mantenemos
// un TTL bajo. Las categorías son mucho más estables.
// Nota: cualquier mutación (create/update/deactivate) invalida el cache de
// inmediato y se propaga entre pestañas vía BroadcastChannel — el TTL es
// solo el "tope superior" de tiempo que un dato puede quedar obsoleto.
const TTL_CATEGORIES = 5 * 60 * 1000;  // 5 min
// Los productos NO se cachean en localStorage (ver getProducts → dedupe):
// evita el bug de imágenes desactualizadas en las cards.

// ── Prefijos de cache para invalidaciones agrupadas ───────────────────────
const CACHE_PREFIX_CATEGORIES = 'categories:';
const CACHE_PREFIX_PRODUCTS   = 'products:';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api   = inject(ApiService);
  private readonly cache = inject(CacheService);

  // ── Categories ────────────────────────────────────────────────────────────

  getCategories(all?: boolean): Observable<ApiResponse<ApiCategory[]>> {
    const key = `${CACHE_PREFIX_CATEGORIES}${all ? 'all' : 'active'}`;
    return this.cache.wrap(
      key,
      () => this.api.get<ApiResponse<ApiCategory[]>>(
        API_CONFIG.endpoints.categories,
        all ? { all: 'true' } : undefined,
      ),
      TTL_CATEGORIES,
    );
  }

  getCategoryById(id: string): Observable<ApiResponse<ApiCategory>> {
    return this.api.get<ApiResponse<ApiCategory>>(
      `${API_CONFIG.endpoints.categories}/${id}`,
    );
  }

  createCategory(payload: { name: string; description?: string }): Observable<ApiResponse<ApiCategory>> {
    return this.api
      .post<ApiResponse<ApiCategory>, { name: string; description?: string }>(
        API_CONFIG.endpoints.categories,
        payload,
      )
      .pipe(tap(() => this.cache.invalidatePrefix(CACHE_PREFIX_CATEGORIES)));
  }

  updateCategory(
    id: string,
    payload: { name?: string; description?: string; isActive?: boolean },
  ): Observable<ApiResponse<ApiCategory>> {
    return this.api
      .put<ApiResponse<ApiCategory>, { name?: string; description?: string; isActive?: boolean }>(
        `${API_CONFIG.endpoints.categories}/${id}`,
        payload,
      )
      .pipe(tap(() => this.cache.invalidatePrefix(CACHE_PREFIX_CATEGORIES)));
  }

  deactivateCategory(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.api
      .patch<ApiResponse<{ message: string }>, Record<string, never>>(
        `${API_CONFIG.endpoints.categories}/${id}/deactivate`,
        {},
      )
      .pipe(tap(() => this.cache.invalidatePrefix(CACHE_PREFIX_CATEGORIES)));
  }

  // ── Products ──────────────────────────────────────────────────────────────

  getProducts(
    category?: string,
    q?: string,
    all?: boolean,
  ): Observable<ApiResponse<ApiProductListItem[]>> {
    // Las búsquedas con texto van directas al backend (alta variabilidad).
    if (q && q.trim().length > 0) {
      return this.api.get<ApiResponse<ApiProductListItem[]>>(
        API_CONFIG.endpoints.products,
        { category, q, all: all ? 'true' : undefined },
      );
    }

    // Listados: usamos `dedupe` (NO persiste en localStorage). Así la lista
    // siempre llega fresca del backend y las imágenes recién subidas se ven de
    // inmediato en las cards. Solo se comparten requests concurrentes idénticos.
    const key = `${CACHE_PREFIX_PRODUCTS}${all ? 'all' : 'active'}:${category ?? 'any'}`;
    return this.cache.dedupe(
      key,
      () => this.api.get<ApiResponse<ApiProductListItem[]>>(
        API_CONFIG.endpoints.products,
        { category, all: all ? 'true' : undefined },
      ),
    );
  }

  /** Productos destacados para el home de ofertas. Sin cache persistente. */
  getFeaturedProducts(): Observable<ApiResponse<ApiProductListItem[]>> {
    return this.cache.dedupe(
      `${CACHE_PREFIX_PRODUCTS}featured`,
      () => this.api.get<ApiResponse<ApiProductListItem[]>>(
        API_CONFIG.endpoints.products,
        { featured: 'true' },
      ),
    );
  }

  getProductById(id: string): Observable<ApiResponse<ApiProductDetail>> {
    return this.api.get<ApiResponse<ApiProductDetail>>(
      `${API_CONFIG.endpoints.products}/${id}`,
    );
  }

  createProduct(payload: CreateProductPayload): Observable<ApiResponse<ApiProductDetail>> {
    return this.api
      .post<ApiResponse<ApiProductDetail>, CreateProductPayload>(
        API_CONFIG.endpoints.products,
        payload,
      )
      .pipe(tap(() => this.cache.invalidatePrefix(CACHE_PREFIX_PRODUCTS)));
  }

  updateProduct(id: string, payload: UpdateProductPayload): Observable<ApiResponse<ApiProductDetail>> {
    return this.api
      .put<ApiResponse<ApiProductDetail>, UpdateProductPayload>(
        `${API_CONFIG.endpoints.products}/${id}`,
        payload,
      )
      .pipe(tap(() => this.cache.invalidatePrefix(CACHE_PREFIX_PRODUCTS)));
  }

  deactivateProduct(id: string): Observable<ApiResponse<{ message: string; id: string }>> {
    return this.api
      .patch<ApiResponse<{ message: string; id: string }>, Record<string, never>>(
        `${API_CONFIG.endpoints.products}/${id}/deactivate`,
        {},
      )
      .pipe(tap(() => this.cache.invalidatePrefix(CACHE_PREFIX_PRODUCTS)));
  }

  uploadProductImage(id: string, file: File): Observable<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api
      .post<ApiResponse<{ imageUrl: string }>, FormData>(
        `${API_CONFIG.endpoints.products}/${id}/image`,
        formData,
      )
      .pipe(tap(() => this.cache.invalidatePrefix(CACHE_PREFIX_PRODUCTS)));
  }
}
