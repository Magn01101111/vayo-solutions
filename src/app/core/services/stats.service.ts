import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse } from '../models/api.models';

export interface DashboardStats {
  counters: {
    products: number;
    categories: number;
    clients: number;
    quotes: number;
    sales: number;
  };
  revenue: {
    total: number;
    paid: number;
  };
  conversionRate: number;
  salesByMonth: Array<{ label: string; total: number; year: number }>;
  quotesByStatus: {
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
  };
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly api = inject(ApiService);

  getDashboard(): Observable<ApiResponse<DashboardStats>> {
    return this.api.get<ApiResponse<DashboardStats>>(API_CONFIG.endpoints.statsDashboard);
  }
}
