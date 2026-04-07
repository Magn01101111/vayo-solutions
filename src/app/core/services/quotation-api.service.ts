import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QuotationApiService {
  private api = inject(ApiService);

  createQuote(payload: any): Observable<any> {
    return this.api.post('quotes', payload);
  }

  downloadPDF(id: string) {
  return this.api.getBlob(`quotes/${id}/pdf`);
}
}
