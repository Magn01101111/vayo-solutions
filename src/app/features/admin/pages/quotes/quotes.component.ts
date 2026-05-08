import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { QuotationApiService, ApiQuote } from '../../../../core/services/quotation-api.service';
import { ClientService } from '../../../../core/services/client.service';
import { ApiClient }     from '../../../../core/models/api.models';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './quotes.component.html',
  styleUrl: './quotes.component.scss',
})
export class QuotesComponent implements OnInit {
  private readonly quoteSvc  = inject(QuotationApiService);
  private readonly clientSvc = inject(ClientService);
  private readonly route     = inject(ActivatedRoute);

  quotes: ApiQuote[] = [];
  loading   = true;
  loadError = '';

  // Filtros
  folioQ      = '';
  clientIdQ   = '';
  filterClient: ApiClient | null = null; // si llegamos con ?clientId=...

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

    const params: { folio?: string; clientId?: string } = {};
    if (this.folioQ.trim())    params.folio    = this.folioQ.trim().toUpperCase();
    if (this.clientIdQ.trim()) params.clientId = this.clientIdQ.trim();

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

  clearFilters(): void {
    this.folioQ       = '';
    this.clientIdQ    = '';
    this.filterClient = null;
    this.load();
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
    };
    return map[status ?? 'sent'] ?? 'Enviada';
  }

  statusBadge(status?: string): string {
    const map: Record<string, string> = {
      sent:     '',
      accepted: 'badge-success',
      rejected: 'badge-danger',
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
