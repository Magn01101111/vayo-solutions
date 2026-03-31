import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;

  get<T>(endpoint: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.buildUrl(endpoint), {
      params: this.buildHttpParams(params),
    });
  }

  post<TResponse, TBody = unknown>(
    endpoint: string,
    body: TBody
  ): Observable<TResponse> {
    return this.http.post<TResponse>(this.buildUrl(endpoint), body);
  }

  put<TResponse, TBody = unknown>(
    endpoint: string,
    body: TBody
  ): Observable<TResponse> {
    return this.http.put<TResponse>(this.buildUrl(endpoint), body);
  }

  patch<TResponse, TBody = unknown>(
    endpoint: string,
    body: TBody
  ): Observable<TResponse> {
    return this.http.patch<TResponse>(this.buildUrl(endpoint), body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint));
  }

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  private buildHttpParams(params?: QueryParams): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }
}
