import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { MyCoupon } from '../models/app.models';

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private api = inject(ApiService);

  getMyCoupons(): Observable<ApiResponse<MyCoupon[]>> {
    return this.api.get<ApiResponse<MyCoupon[]>>(API_CONFIG.endpoints.couponsMine);
  }
}
