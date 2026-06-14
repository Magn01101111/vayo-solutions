import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { QuotationApiService, ApiQuote, QuoteStatus } from '../../../../core/services/quotation-api.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { VayoModalComponent } from '../../../../shared/components/vayo-modal/vayo-modal.component';
import { ClientService } from '../../../../core/services/client.service';
import { SaleService }   from '../../../../core/services/sale.service';
import { AuthService }   from '../../../../core/services/auth.service';
import { ApiClient }     from '../../../../core/models/api.models';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, VayoModalComponent],
  templateUrl: './quotes.component.html',
  styleUrl: './quotes.component.scss',
})
export class QuotesComponent implements OnInit {
  private readonly quoteSvc  = inject(QuotationApiService);
  private readonly clientSvc = inject(ClientService);
  private readonly saleSvc   = inject(SaleService);
  private readonly route     = inject(ActivatedRoute);
  private readonly authSvc   = inject(AuthService);

  quotes: ApiQuote[] = [];
  loading   = true;
  loadError = '';

  // Filtros
  folioQ      = '';
  clientIdQ   = '';
  mineOnly    = false;
  filterClient: ApiClient | null = null; // si llegamos con ?clientId=...

  // Conversión a venta
  convertingId = '';
  convertMsg   = '';
  convertError = '';

  // Cambio de estado
  updatingStatusId = '';

  // Acciones de PDF / email
  downloadingId = '';
  emailSendingId = '';
  actionMsg   = '';
  actionError = '';

  // Modal de detalle
  detailQuote: ApiQuote | null = null;
  showDetail  = false;

  readonly statusOptions: { value: QuoteStatus; label: string }[] = [
    { value: 'sent',     label: 'Enviada' },
    { value: 'accepted', label: 'Aceptada' },
    { value: 'rejected', label: 'Rechazada' },
    { value: 'expired',  label: 'Vencida' },
  ];

  ngOnInit(): void {
    // Permite llegar directo desde clientes con /admin/cotizaciones?clientId=...
    const queryClientId = this.route.snapshot.queryParamMap.get('clientId');
    if (queryClientId) {
      this.clientIdQ = queryClientId;
      this.loadClient(queryClientId);
    }
    this.load();
  }

  loadClient(id: string): void {
    this.clientSvc.getClientById(id).subscribe({
      next: (res) => { this.filterClient = res.data; },
      error: () => { /* silencioso */ },
    });
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';

    const params: { folio?: string; clientId?: string; mine?: string } = {};
    if (this.folioQ.trim())    params.folio    = this.folioQ.trim().toUpperCase();
    if (this.clientIdQ.trim()) params.clientId = this.clientIdQ.trim();
    if (this.mineOnly)         params.mine     = 'true';

    this.quoteSvc.getQuotes(params).subscribe({
      next: (res) => {
        this.quotes  = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Error al cargar cotizaciones.';
        this.loading   = false;
      },
    });
  }

  searchByFolio(): void {
    this.load();
  }

  /** Convierte una cotización en venta. */
  convertToSale(quote: ApiQuote): void {
    this.convertMsg   = '';
    this.convertError = '';
    this.convertingId = quote._id;

    this.saleSvc.createFromQuote(quote._id).subscribe({
      next: (res) => {
        this.convertingId = '';
        this.convertMsg = `Venta ${res.data.folio} creada a partir de ${quote.folio}.`;
        this.load(); // refresca: la cotización pasa a "aceptada"
        setTimeout(() => (this.convertMsg = ''), 5000);
      },
      error: (err) => {
        this.convertingId = '';
        this.convertError = err?.error?.error ?? 'No se pudo convertir la cotización.';
        setTimeout(() => (this.convertError = ''), 6000);
      },
    });
  }

  clearFilters(): void {
    this.folioQ       = '';
    this.clientIdQ    = '';
    this.filterClient = null;
    this.load();
  }

  // ── Ver detalle ─────────────────────────────────────────────────────────────

  openDetail(quote: ApiQuote): void {
    this.showDetail  = true;
    this.detailQuote = quote;
    // Recargar el detalle completo desde el backend (trae items completos).
    this.quoteSvc.getQuoteById(quote._id).subscribe({
      next: (res) => { this.detailQuote = res.data; },
      error: () => { /* se queda con el resumen que ya tenía */ },
    });
  }

  closeDetail(): void {
    this.showDetail = false;
    this.detailQuote = null;
  }

  // ── Descargar PDF ───────────────────────────────────────────────────────────

  downloadPdf(quote: ApiQuote): void {
    this.actionMsg = '';
    this.actionError = '';
    this.downloadingId = quote._id;

    this.quoteSvc.downloadPDF(quote._id).subscribe({
      next: (blob) => {
        if (!(blob instanceof Blob) || blob.size === 0) {
          this.actionError = 'El PDF vino vacío.';
          this.downloadingId = '';
          return;
        }
        const pdfBlob = blob.type?.includes('pdf') ? blob : new Blob([blob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${quote.folio || 'cotizacion'}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        this.downloadingId = '';
      },
      error: (err) => {
        this.downloadingId = '';
        this.actionError = err?.error?.error ?? 'No se pudo descargar el PDF.';
        setTimeout(() => (this.actionError = ''), 6000);
      },
    });
  }

  // ── Reenviar por email ──────────────────────────────────────────────────────

  resendEmail(quote: ApiQuote): void {
    const to = quote.client?.email;
    if (!to) {
      this.actionError = 'Esta cotización no tiene email de cliente.';
      setTimeout(() => (this.actionError = ''), 5000);
      return;
    }
    this.actionMsg = '';
    this.actionError = '';
    this.emailSendingId = quote._id;

    this.quoteSvc.sendByEmail(quote._id, to).subscribe({
      next: (res) => {
        this.emailSendingId = '';
        this.actionMsg = res.data?.message ?? `Cotización enviada a ${to}.`;
        setTimeout(() => (this.actionMsg = ''), 6000);
      },
      error: (err) => {
        this.emailSendingId = '';
        this.actionError = err?.error?.error ?? 'No se pudo enviar el correo.';
        setTimeout(() => (this.actionError = ''), 6000);
      },
    });
  }

  duplicateQuote(quote: ApiQuote): void {
    this.quoteSvc.duplicateQuote(quote._id).subscribe({
      next: (res) => {
        if (res.ok) {
          this.actionMsg = `Cotización duplicada como ${res.data.folio}`;
          setTimeout(() => (this.actionMsg = ''), 5000);
          this.load();
        }
      },
      error: (err) => {
        this.actionError = err?.error?.error ?? 'No se pudo duplicar la cotización.';
        setTimeout(() => (this.actionError = ''), 5000);
      },
    });
  }

  /** Cambia el estado de la cotización desde el <select>. */
  onStatusChange(quote: ApiQuote, status: QuoteStatus): void {
    if (quote.metadata?.status === status) return;
    this.updatingStatusId = quote._id;
    this.quoteSvc.updateStatus(quote._id, status).subscribe({
      next: (res) => {
        const idx = this.quotes.findIndex((q) => q._id === quote._id);
        if (idx >= 0) this.quotes[idx] = res.data;
        this.updatingStatusId = '';
      },
      error: () => { this.updatingStatusId = ''; this.load(); },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatCLP(value: number | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
    }).format(value);
  }

  statusLabel(status?: string): string {
    const map: Record<string, string> = {
      sent:     'Enviada',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      expired:  'Vencida',
    };
    return map[status ?? 'sent'] ?? 'Enviada';
  }

  statusBadge(status?: string): string {
    const map: Record<string, string> = {
      sent:     '',
      accepted: 'badge-success',
      rejected: 'badge-danger',
      expired:  'badge-warning',
    };
    return map[status ?? 'sent'] ?? '';
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }
}
