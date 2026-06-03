import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import {
  ApiResponse,
  ApiReview,
  ApiReviewSummary,
  ApiReviewStatus,
  CreateReviewPayload,
} from '../models/api.models';

export interface ProductReviewsResponse {
  summary: ApiReviewSummary;
  reviews: ApiReview[];
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly api = inject(ApiService);

  /** Reseñas aprobadas + resumen (público). */
  getProductReviews(productId: string): Observable<ApiResponse<ProductReviewsResponse>> {
    return this.api.get<ApiResponse<ProductReviewsResponse>>(
      `${API_CONFIG.endpoints.reviews}/product/${productId}`,
    );
  }

  /** Crea una reseña (CLIENTE autenticado). */
  createReview(productId: string, payload: CreateReviewPayload): Observable<ApiResponse<{ message: string; review: ApiReview }>> {
    return this.api.post<ApiResponse<{ message: string; review: ApiReview }>, CreateReviewPayload>(
      `${API_CONFIG.endpoints.reviews}/product/${productId}`,
      payload,
    );
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  getAllReviews(status?: ApiReviewStatus): Observable<ApiResponse<ApiReview[]>> {
    return this.api.get<ApiResponse<ApiReview[]>>(
      API_CONFIG.endpoints.reviews,
      status ? { status } : undefined,
    );
  }

  moderate(id: string, status: ApiReviewStatus): Observable<ApiResponse<ApiReview>> {
    return this.api.patch<ApiResponse<ApiReview>, { status: ApiReviewStatus }>(
      `${API_CONFIG.endpoints.reviews}/${id}/status`,
      { status },
    );
  }

  remove(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.api.delete<ApiResponse<{ message: string }>>(
      `${API_CONFIG.endpoints.reviews}/${id}`,
    );
  }
}
