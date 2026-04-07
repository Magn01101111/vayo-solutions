import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationService } from '../../../../../../core/services/quotation.service';
import { Router } from '@angular/router';
import { QuotationApiService } from '../../../../../../core/services/quotation-api.service';

@Component({
  selector: 'app-step-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-confirmation.component.html',
  styleUrl: './step-confirmation.component.scss',
})
export class StepConfirmationComponent {
  private router = inject(Router);
  private qs = inject(QuotationService);
  private quoteApi = inject(QuotationApiService);

  loading = signal(true);
  success = signal(false);
  error = signal<string | null>(null);
  quoteId = signal<string | null>(null);

  ngOnInit() {
    this.sendQuote();
  }

  sendQuote() {
    const payload = this.qs.buildPayload();

    this.quoteApi.createQuote(payload).subscribe({
      next: (res: any) => {
        this.quoteId.set(res._id); // 🔥 CLAVE
        this.success.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al enviar cotización');
        this.loading.set(false);
      },
    });
  }

  downloadPDF() {
    if (!this.quoteId()) return;

    this.quoteApi.downloadPDF(this.quoteId()!).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${this.quoteId()}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }

  finish() {
    this.qs.clearAll();
    this.router.navigate(['/catalogo']);
  }
}
