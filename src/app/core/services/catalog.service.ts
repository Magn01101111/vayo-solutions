import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import {
  ApiCategory,
  ApiProductDetail,
  ApiProductListItem,
  ApiResponse,
  CreateProductPayload,
} from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly api = inject(ApiService);

  getCategories(): Observable<ApiResponse<ApiCategory[]>> {
    return this.api.get<ApiResponse<ApiCategory[]>>(
      API_CONFIG.endpoints.categories
    );
  }

  getProducts(
    category?: string,
    q?: string
  ): Observable<ApiResponse<ApiProductListItem[]>> {
    return this.api.get<ApiResponse<ApiProductListItem[]>>(
      API_CONFIG.endpoints.products,
      {
        category,
        q,
      }
    );
  }

  getProductById(id: string): Observable<ApiResponse<ApiProductDetail>> {
    return this.api.get<ApiResponse<ApiProductDetail>>(
      `${API_CONFIG.endpoints.products}/${id}`
    );
  }

  createProduct(
    payload: CreateProductPayload
  ): Observable<ApiResponse<ApiProductDetail>> {
    return this.api.post<ApiResponse<ApiProductDetail>, CreateProductPayload>(
      API_CONFIG.endpoints.adminProducts,
      payload
    );
  }
}
