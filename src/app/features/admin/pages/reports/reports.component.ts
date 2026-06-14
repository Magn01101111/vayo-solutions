import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { ReportService, ReportType, ReportFilters } from '../../../../core/services/report.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

interface ReportCard {
  type: ReportType;
  title: string;
  icon: string;
  description: string;
  /** Estados posibles para el filtro (vacío = sin filtro de estado). */
  statuses: { value: string; label: string }[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  private readonly reportSvc = inject(ReportService);

  // Filtros compartidos
  from = '';
  to   = '';
  statusByType: Record<ReportType, string> = { sales: '', quotes: '', clients: '' };

  // Estado de descarga
  downloading = signal<ReportType | null>(null);
  error = signal('');

  readonly reports: ReportCard[] = [
    {
      type: 'sales',
      title: 'Ventas',
      icon: 'receipt',
      description: 'Exporta las ventas registradas con cliente, montos y estado.',
      statuses: [
        { value: '',          label: 'Todos los estados' },
        { value: 'pending',   label: 'Pendiente' },
        { value: 'paid',      label: 'Pagada' },
        { value: 'cancelled', label: 'Anulada' },
      ],
    },
    {
      type: 'quotes',
      title: 'Cotizaciones',
      icon: 'document',
      description: 'Exporta las cotizaciones con cliente, ítems, totales y estado.',
      statuses: [
        { value: '',         label: 'Todos los estados' },
        { value: 'sent',     label: 'Enviada' },
        { value: 'accepted', label: 'Aceptada' },
        { value: 'rejected', label: 'Rechazada' },
        { value: 'expired',  label: 'Vencida' },
      ],
    },
    {
      type: 'clients',
      title: 'Clientes',
      icon: 'users',
      description: 'Exporta el directorio de clientes con datos de contacto.',
      statuses: [],
    },
  ];

  download(type: ReportType): void {
    this.error.set('');
    this.downloading.set(type);

    const filters: ReportFilters = {
      from: this.from || undefined,
      to: this.to || undefined,
      status: this.statusByType[type] || undefined,
    };

    this.reportSvc.downloadCSV(type, filters).subscribe({
      next: (blob) => {
        if (!(blob instanceof Blob) || blob.size === 0) {
          this.error.set('El reporte vino vacío.');
          this.downloading.set(null);
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${type}-${this.todayStamp()}.csv`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        this.downloading.set(null);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudo generar el reporte.');
        this.downloading.set(null);
      },
    });
  }

  clearDates(): void {
    this.from = '';
    this.to = '';
  }

  private todayStamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  }
}
