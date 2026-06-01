import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { StatsService, DashboardStats } from '../../../../core/services/stats.service';

interface MetricCard {
  label: string;
  value: string;
  icon: string;
  link: string;
  hint: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly statsService = inject(StatsService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  error = signal('');

  // ── Tarjetas de métricas ──────────────────────────────────────────────────
  metrics = computed<MetricCard[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Ingresos', value: this.formatCLP(s.revenue.total), icon: '💰', link: '/admin/ventas', hint: 'Ventas no anuladas' },
      { label: 'Ventas', value: String(s.counters.sales), icon: '🧾', link: '/admin/ventas', hint: 'Total registradas' },
      { label: 'Cotizaciones', value: String(s.counters.quotes), icon: '📄', link: '/admin/cotizaciones', hint: `Conversión ${s.conversionRate}%` },
      { label: 'Productos', value: String(s.counters.products), icon: '📦', link: '/admin/productos', hint: 'Activos en catálogo' },
      { label: 'Clientes', value: String(s.counters.clients), icon: '👥', link: '/admin/clientes', hint: 'Registrados' },
      { label: 'Categorías', value: String(s.counters.categories), icon: '🗂️', link: '/admin/categorias', hint: 'Activas' },
    ];
  });

  // ── Datos derivados para los gráficos ─────────────────────────────────────

  /** Máximo de la serie mensual, para escalar las barras. Mínimo 1 para no dividir por 0. */
  maxMonthly = computed(() => {
    const s = this.stats();
    if (!s) return 1;
    return Math.max(1, ...s.salesByMonth.map((m) => m.total));
  });

  /** Total de cotizaciones para los porcentajes del gráfico de estados. */
  totalQuotes = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    const q = s.quotesByStatus;
    return q.sent + q.accepted + q.rejected + q.expired;
  });

  statusList = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const q = s.quotesByStatus;
    const total = this.totalQuotes() || 1;
    return [
      { label: 'Enviadas',  value: q.sent,     color: '#378add', pct: Math.round((q.sent / total) * 100) },
      { label: 'Aceptadas', value: q.accepted, color: '#1e6e3f', pct: Math.round((q.accepted / total) * 100) },
      { label: 'Rechazadas',value: q.rejected, color: '#993c1d', pct: Math.round((q.rejected / total) * 100) },
      { label: 'Vencidas',  value: q.expired,  color: '#b48214', pct: Math.round((q.expired / total) * 100) },
    ];
  });

  maxTopProduct = computed(() => {
    const s = this.stats();
    if (!s || s.topProducts.length === 0) return 1;
    return Math.max(1, ...s.topProducts.map((p) => p.qty));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.statsService.getDashboard().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las estadísticas.');
        this.loading.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatCLP(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  /** Altura porcentual de una barra mensual. */
  barHeight(total: number): number {
    return Math.round((total / this.maxMonthly()) * 100);
  }

  /** Ancho porcentual de una barra de top producto. */
  topWidth(qty: number): number {
    return Math.round((qty / this.maxTopProduct()) * 100);
  }
}
