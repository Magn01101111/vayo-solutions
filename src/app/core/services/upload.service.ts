import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService }   from './api.service';
import { API_CONFIG }   from '../config/api.config';
import { ApiResponse, UploadResponse } from '../models/api.models';

/**
 * Servicio para subir archivos a Cloudinary vía el backend.
 * El backend nunca expone credenciales de Cloudinary al cliente.
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly api = inject(ApiService);

  /**
   * Sube una imagen de producto.
   * @returns Observable<{ url, publicId }>
   */
  uploadProductImage(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    return this.api
      .post<ApiResponse<UploadResponse>, FormData>(
        API_CONFIG.endpoints.uploadProduct,
        formData,
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Validación cliente de un archivo de imagen antes de subirlo.
   * Retorna un mensaje de error o null si está OK.
   */
  validateImageFile(
    file: File,
    maxSizeMb = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  ): string | null {
    if (!allowedTypes.includes(file.type)) {
      return 'Formato no permitido. Usa JPG, PNG o WEBP.';
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSizeMb) {
      return `La imagen pesa ${sizeMb.toFixed(1)} MB. Máximo permitido: ${maxSizeMb} MB.`;
    }
    return null;
  }
}
