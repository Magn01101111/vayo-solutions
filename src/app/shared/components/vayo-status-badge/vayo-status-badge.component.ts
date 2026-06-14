import { Component, computed, input } from '@angular/core';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
type SaleStatus  = 'pending' | 'paid' | 'cancelled';

const QUOTE_LABELS: Record<QuoteStatus, string> = {
  draft:    'Borrador',
  sent:     'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired:  'Expirada',
};

const SALE_LABELS: Record<SaleStatus, string> = {
  pending:   'Pendiente',
  paid:      'Pagada',
  cancelled: 'Anulada',
};

@Component({
  selector: 'vayo-status-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="cssClass()">
      <span class="dot" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: var(--font-mono); font-size: var(--fs-2xs);
      font-weight: var(--fw-medium); letter-spacing: .03em;
      text-transform: uppercase; padding: 4px 9px;
      border-radius: var(--r-xs); border: 1px solid transparent; line-height: 1.3;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; }
    .badge--draft    { background: var(--paper-3);   color: var(--ink-3);   border-color: var(--line); }
    .badge--sent     { background: var(--warn-bg);   color: var(--warn);    border-color: var(--warn-line); }
    .badge--accepted { background: var(--ok-bg);     color: var(--ok);      border-color: var(--ok-line); }
    .badge--rejected { background: var(--danger-bg); color: var(--danger);  border-color: var(--danger-line); }
    .badge--expired  { background: var(--paper-3);   color: var(--ink-3);   border-color: var(--line); }
    .badge--pending  { background: var(--warn-bg);   color: var(--warn);    border-color: var(--warn-line); }
    .badge--paid     { background: var(--ok-bg);     color: var(--ok);      border-color: var(--ok-line); }
    .badge--cancelled{ background: var(--danger-bg); color: var(--danger);  border-color: var(--danger-line); }
  `],
})
export class VayoStatusBadgeComponent {
  readonly status = input.required<string>();

  readonly label = computed(() => {
    const s = this.status() as QuoteStatus & SaleStatus;
    return QUOTE_LABELS[s as QuoteStatus] ?? SALE_LABELS[s as SaleStatus] ?? s;
  });

  readonly cssClass = computed(() => `badge badge--${this.status()}`);
}
