import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatsService, DashboardStats } from '../../../../core/services/stats.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly statsService = inject(StatsService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  error = signal('');

  /** Largo de la circunferencia del anillo de cobranza (r=52 → 2πr). */
  readonly ringCirc = 326.7;
  /** Largo del arco semicircular del medidor de conversión. */
  readonly gaugeLen = 245;

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

  /** Cotizaciones por estado — color vía token (no hex hardcodeado). */
  statusList = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const q = s.quotesByStatus;
    const total = this.totalQuotes() || 1;
    return [
      { label: 'Enviadas',   value: q.sent,     color: 'var(--warn)',  pct: Math.round((q.sent / total) * 100) },
      { label: 'Aceptadas',  value: q.accepted, color: 'var(--ok)',     pct: Math.round((q.accepted / total) * 100) },
      { label: 'Rechazadas', value: q.rejected, color: 'var(--danger)', pct: Math.round((q.rejected / total) * 100) },
      { label: 'Expiradas',  value: q.expired,  color: 'var(--ink-3)',  pct: Math.round((q.expired / total) * 100) },
    ];
  });

  maxTopProduct = computed(() => {
    const s = this.stats();
    if (!s || s.topProducts.length === 0) return 1;
    return Math.max(1, ...s.topProducts.map((p) => p.qty));
  });

  // ── Expansiones con datos REALES ──────────────────────────────────────────

  /** % cobrado del período = revenue.paid / revenue.total (dato que antes se ignoraba). */
  paidPct = computed(() => {
    const s = this.stats();
    if (!s || !s.revenue.total) return 0;
    return Math.round((s.revenue.paid / s.revenue.total) * 100);
  });

  /** Monto pendiente de cobro. */
  pendingAmount = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    return Math.max(0, s.revenue.total - s.revenue.paid);
  });

  /** Desfase del trazo del anillo de cobranza. */
  ringOffset = computed(() => this.ringCirc * (1 - this.paidPct() / 100));

  /** Desfase del trazo del medidor de conversión. */
  gaugeOffset = computed(() => {
    const s = this.stats();
    const rate = s ? s.conversionRate : 0;
    return this.gaugeLen * (1 - Math.min(100, Math.max(0, rate)) / 100);
  });

  /** % de aceptación de cotizaciones (aceptadas / emitidas). */
  acceptancePct = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    const total = this.totalQuotes() || 1;
    return Math.round((s.quotesByStatus.accepted / total) * 100);
  });

  /** Cupones efectivamente canjeados (F5-1). */
  couponsRedeemed = computed(() => this.stats()?.coupons?.redeemed ?? 0);

  /** Ahorro total otorgado vía cupones (F5-1). */
  couponSavings = computed(() => this.stats()?.coupons?.savings ?? 0);

  /** Ticket promedio = ingresos / ventas. */
  ticketProm = computed(() => {
    const s = this.stats();
    if (!s || !s.counters.sales) return 0;
    return Math.round(s.revenue.total / s.counters.sales);
  });

  /** Variación mes a mes (MoM): último mes vs anterior de salesByMonth. */
  momDelta = computed(() => {
    const s = this.stats();
    if (!s || s.salesByMonth.length < 2) return null;
    const arr = s.salesByMonth;
    const last = arr[arr.length - 1];
    const prev = arr[arr.length - 2];
    if (!prev.total) return null;
    const pct = Math.round(((last.total - prev.total) / prev.total) * 100);
    return {
      pct,
      dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
      lastLabel: last.label,
      prevLabel: prev.label,
    };
  });

  /** Sparkline de ingresos derivado de salesByMonth (paths SVG para viewBox 78×26). */
  sparkline = computed(() => {
    const s = this.stats();
    if (!s || s.salesByMonth.length < 2) return null;
    const vals = s.salesByMonth.map((m) => m.total);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const range = max - min || 1;
    const w = 78;
    const h = 26;
    const n = vals.length;
    const pts = vals.map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y = h - 2 - ((v - min) / range) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');
    const area = `${line} L${w},${h} L0,${h} Z`;
    return { line, area };
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

  /** Formato compacto para KPIs grandes: $80,4M · $679K. */
  formatCompactCLP(value: number): string {
    const v = value ?? 0;
    if (v >= 1_000_000) {
      return '$' + (v / 1_000_000).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + 'M';
    }
    if (v >= 1_000) {
      return '$' + Math.round(v / 1_000) + 'K';
    }
    return this.formatCLP(v);
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
