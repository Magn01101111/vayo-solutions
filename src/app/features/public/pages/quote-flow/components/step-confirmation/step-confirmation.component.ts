import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuotationService } from '../../../../../../core/services/quotation.service';
import { QuotationApiService } from '../../../../../../core/services/quotation-api.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { normalizeChileanPhone } from '../../../../../../core/utils/validators';

@Component({
  selector: 'app-step-confirmation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-confirmation.component.html',
  styleUrl: './step-confirmation.component.scss',
})
export class StepConfirmationComponent {
  private router = inject(Router);
  private qs = inject(QuotationService);
  private quoteApi = inject(QuotationApiService);
  private auth = inject(AuthService);

  // ── Oferta de crear cuenta (solo para invitados) ──────────────────────────
  /** true si NO hay sesión → tiene sentido ofrecer crear cuenta. */
  get isGuest(): boolean { return !this.auth.isAuthenticated; }
  showAccountForm = signal(false);
  accountPassword = signal('');
  accountCreating = signal(false);
  accountCreated  = signal(false);
  accountError    = signal('');

  loading = signal(true);
  success = signal(false);
  error = signal<string | null>(null);
  quoteId = signal<string | null>(null);
  folio = signal<string | null>(null);
  pdfToken = signal<string | null>(null);
  copied = signal(false);
  pdfDownloading = signal(false);

  total = this.qs.total;
  client = this.qs.client;
  itemCount = this.qs.totalItems;

  shareUrl = computed(() => {
    const id = this.quoteId();
    if (!id) return '';
    if (typeof window === 'undefined') return '';
    return this.quoteApi.publicPdfUrl(id, this.pdfToken());
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
    console.log('[StepConfirmation] POST quotes payload →', payload);

    this.quoteApi.createQuote(payload).subscribe({
      next: (res: any) => {
        console.log('[StepConfirmation] respuesta backend →', res);
        // El backend puede devolver el documento directo o envuelto en { data: {...} }.
        const data = res?.data ?? res ?? {};
        const id = data._id ?? data.id ?? null;
        const folio = data.folio ?? null;
        const pdfToken = data.pdfToken ?? res?.pdfToken ?? null;

        if (!id) {
          console.warn('[StepConfirmation] respuesta sin _id, no se podrá descargar PDF', res);
        }

        this.quoteId.set(id);
        this.folio.set(folio);
        this.pdfToken.set(pdfToken);
        this.success.set(true);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('[StepConfirmation] error al enviar cotización', err);
        const msg =
          err?.error?.message ??
          err?.message ??
          'No pudimos enviar la cotización. Verifica tu conexión.';
        this.error.set(`${msg} (${err?.status ?? '—'})`);
        this.loading.set(false);
      },
    });
  }

  downloadPDF() {
    const id = this.quoteId();
    if (!id) {
      console.warn('[StepConfirmation] downloadPDF abortado: no hay quoteId');
      this.error.set('No hay cotización generada para descargar.');
      return;
    }

    this.pdfDownloading.set(true);
    const token = this.pdfToken();
    console.log('[StepConfirmation] GET PDF para id →', id, token ? '(con pdfToken)' : '(sin token)');

    this.quoteApi.downloadPDF(id, token).subscribe({
      next: (blob) => {
        if (!(blob instanceof Blob) || blob.size === 0) {
          console.error('[StepConfirmation] blob inválido o vacío', blob);
          this.pdfDownloading.set(false);
          this.error.set('El servidor devolvió un PDF vacío.');
          return;
        }

        const pdfBlob =
          blob.type && blob.type.includes('pdf')
            ? blob
            : new Blob([blob], { type: 'application/pdf' });

        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cotizacion-${this.folio() ?? id}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Liberar la URL después de que el navegador inicie la descarga.
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        this.pdfDownloading.set(false);
      },
      error: (err) => {
        console.error('[StepConfirmation] error al descargar PDF', err);
        this.pdfDownloading.set(false);
        const msg =
          err?.error?.message ??
          err?.message ??
          'No pudimos generar el PDF.';
        this.error.set(`${msg} (${err?.status ?? '—'})`);
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

  // ── Crear cuenta tras la compra (invitado → cliente registrado) ───────────

  toggleAccountForm(): void {
    this.showAccountForm.update((v) => !v);
    this.accountError.set('');
  }

  /** Crea una cuenta usando los datos ya capturados en la cotización. */
  createAccount(): void {
    const c = this.qs.client();
    if (!c) {
      this.accountError.set('No hay datos de cliente para crear la cuenta.');
      return;
    }
    if (this.accountPassword().length < 8) {
      this.accountError.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!c.taxId) {
      this.accountError.set('Falta el RUT para crear la cuenta.');
      return;
    }

    const phone = normalizeChileanPhone(c.phone ?? '');
    if (!phone) {
      this.accountError.set('El teléfono registrado no es válido para crear la cuenta.');
      return;
    }

    this.accountCreating.set(true);
    this.accountError.set('');

    this.auth.register({
      name: c.name,
      email: c.email,
      password: this.accountPassword(),
      rut: c.taxId,
      phone,
    }).subscribe({
      next: () => {
        this.accountCreating.set(false);
        this.accountCreated.set(true);
        this.showAccountForm.set(false);
      },
      error: (err) => {
        this.accountCreating.set(false);
        this.accountError.set(err?.error?.error ?? 'No se pudo crear la cuenta.');
      },
    });
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
