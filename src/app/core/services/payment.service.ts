import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse } from '../models/api.models';

export interface WebpayInitResponse {
  token: string;
  url: string;
  paymentId: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);

  /** Inicia un pago Webpay para una venta. Devuelve { token, url }. */
  initWebpay(saleId: string): Observable<ApiResponse<WebpayInitResponse>> {
    return this.api.post<ApiResponse<WebpayInitResponse>, { saleId: string }>(
      API_CONFIG.endpoints.paymentsWebpayInit,
      { saleId },
    );
  }

  /**
   * Redirige el navegador a Webpay.
   * Webpay exige un POST con el campo `token_ws` (no acepta un simple redirect GET),
   * así que construimos un formulario oculto y lo enviamos: provoca una navegación
   * de página completa hacia el formulario de pago de Transbank.
   */
  redirectToWebpay(url: string, token: string): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = token;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  }
}
