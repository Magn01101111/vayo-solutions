import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuotationService } from '../../../../../../core/services/quotation.service';
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
  folio = signal<string | null>(null);
  copied = signal(false);
  emailSending = signal(false);
  emailSent = signal(false);
  pdfDownloading = signal(false);

  total = this.qs.total;
  client = this.qs.client;
  itemCount = this.qs.totalItems;

  shareUrl = computed(() => {
    const id = this.quoteId();
    if (!id) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/cotizacion/ver/${id}`;
  });

  formatCLP(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  ngOnInit() {
    this.sendQuote();
  }

  sendQuote() {
    this.loading.set(true);
    this.error.set(null);
    const payload = this.qs.buildPayload();

    this.quoteApi.createQuote(payload).subscribe({
      next: (res: any) => {
        this.quoteId.set(res?._id ?? null);
        this.folio.set(res?.folio ?? null);
        this.success.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos enviar la cotización. Verifica tu conexión.');
        this.loading.set(false);
      },
    });
  }

  downloadPDF() {
    const id = this.quoteId();
    if (!id) return;

    this.pdfDownloading.set(true);
    this.quoteApi.downloadPDF(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cotizacion-${this.folio() ?? id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.pdfDownloading.set(false);
      },
      error: () => {
        this.pdfDownloading.set(false);
        this.error.set('No pudimos generar el PDF.');
      },
    });
  }

  async copyLink() {
    const url = this.shareUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    }
  }

  shareWhatsApp() {
    const c = this.qs.client();
    const msg = `Hola${c?.name ? ' ' + c.name : ''}, aquí tienes tu cotización VAYO #${this.folio() ?? this.quoteId()}: ${this.shareUrl()}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  shareEmail() {
    const subject = `Cotización VAYO #${this.folio() ?? this.quoteId()}`;
    const body = `Hola,\n\nTe comparto la cotización solicitada:\n${this.shareUrl()}\n\nSaludos.`;
    const url = `mailto:${this.qs.client()?.email ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  resendByEmail() {
    this.emailSending.set(true);
    setTimeout(() => {
      this.emailSending.set(false);
      this.emailSent.set(true);
      setTimeout(() => this.emailSent.set(false), 3000);
    }, 1200);
  }

  back() {
    this.qs.prevStep();
  }

  finish() {
    this.qs.clearAll();
    this.router.navigate(['/catalogo']);
  }

  goHome() {
    this.qs.clearAll();
    this.router.navigate(['/']);
  }
}
