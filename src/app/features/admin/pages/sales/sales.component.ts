import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { SaleService, ApiSale, SaleStatus } from '../../../../core/services/sale.service';
import { VayoModalComponent } from '../../../../shared/components/vayo-modal/vayo-modal.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, VayoModalComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent implements OnInit {
  private readonly saleSvc = inject(SaleService);

  sales: ApiSale[] = [];
  loading   = true;
  loadError = '';

  folioQ      = '';
  statusFilter: '' | SaleStatus = '';

  // Cambio de estado en proceso (para deshabilitar botones)
  updatingId = '';

  // Modal detalle
  showDetail = false;
  detailSale: ApiSale | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';

    const params: { folio?: string; status?: SaleStatus } = {};
    if (this.folioQ.trim()) params.folio = this.folioQ.trim().toUpperCase();
    if (this.statusFilter)  params.status = this.statusFilter;

    this.saleSvc.getSales(params).subscribe({
      next: (res) => {
        this.sales   = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Error al cargar ventas.';
        this.loading   = false;
      },
    });
  }

  search(): void { this.load(); }

  clearFilters(): void {
    this.folioQ = '';
    this.statusFilter = '';
    this.load();
  }

  changeStatus(sale: ApiSale, status: SaleStatus): void {
    if (sale.status === status) return;
    this.updatingId = sale.id;
    this.saleSvc.updateStatus(sale.id, status).subscribe({
      next: (res) => {
        const idx = this.sales.findIndex((s) => s.id === sale.id);
        if (idx >= 0) this.sales[idx] = res.data;
        // Actualizar también el detalle si está abierto
        if (this.detailSale?.id === sale.id) this.detailSale = res.data;
        this.updatingId = '';
      },
      error: () => { this.updatingId = ''; },
    });
  }

  openDetail(sale: ApiSale): void {
    this.detailSale = sale;
    this.showDetail = true;
  }

  closeDetail(): void {
    this.showDetail = false;
    this.detailSale = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatCLP(value: number | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
    }).format(value);
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  statusLabel(status?: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente', paid: 'Pagada', cancelled: 'Anulada',
    };
    return map[status ?? 'pending'] ?? 'Pendiente';
  }

  statusBadge(status?: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning', paid: 'badge-success', cancelled: 'badge-danger',
    };
    return map[status ?? 'pending'] ?? '';
  }

  paymentLabel(method?: string): string {
    const map: Record<string, string> = {
      cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta',
      credit: 'Crédito', other: 'Otro',
    };
    return map[method ?? 'transfer'] ?? '—';
  }
}
