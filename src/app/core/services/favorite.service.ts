import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  private _favoriteIds = signal<Set<string>>(new Set());
  favoriteIds = this._favoriteIds.asReadonly();

  loadFavorites(): void {
    if (!this.authService.token) return;
    this.api
      .get<{ ok: boolean; data: { productId: string }[] }>(API_CONFIG.endpoints.favorites)
      .subscribe({
        next: (res) => {
          if (res.ok && res.data) {
            this._favoriteIds.set(new Set(res.data.map((f) => f.productId)));
          }
        },
      });
  }

  isFavorite(productId: string): boolean {
    return this._favoriteIds().has(productId);
  }

  toggle(productId: string): void {
    if (!this.authService.token) return;
    const isFav = this.isFavorite(productId);

    const request = isFav
      ? this.api.delete(`${API_CONFIG.endpoints.favorites}/${productId}`)
      : this.api.post(`${API_CONFIG.endpoints.favorites}/${productId}`, {});

    request.subscribe({
      next: () => {
        const updated = new Set(this._favoriteIds());
        if (isFav) {
          updated.delete(productId);
        } else {
          updated.add(productId);
        }
        this._favoriteIds.set(updated);
      },
    });
  }
}
