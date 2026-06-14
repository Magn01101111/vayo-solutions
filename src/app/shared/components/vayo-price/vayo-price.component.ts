import { Component, computed, input } from '@angular/core';

/**
 * Muestra precio neto + IVA. Si hay offerPrice < price muestra precio tachado + %.
 * El backend calcula los montos; este componente solo presenta.
 *
 * Uso: <vayo-price [price]="p.price" [offerPrice]="p.offerPrice" />
 */
@Component({
  selector: 'vayo-price',
  standalone: true,
  template: `
    <div class="vp" [class.vp--offer]="hasOffer()">
      @if (hasOffer()) {
        <span class="vp__original">{{ fmt(price()) }}</span>
        <span class="badge badge--offer vp__badge">-{{ discountPct() }}%</span>
      }
      <span class="vp__main">{{ fmt(activePrice()) }}</span>
      <span class="vp__iva">+ IVA</span>
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }
    .vp {
      display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;
    }
    .vp__main {
      font-family: var(--font-mono); font-size: var(--fs-data);
      font-weight: var(--fw-bold); color: var(--ink); line-height: 1;
    }
    .vp--offer .vp__main { color: var(--offer); }
    .vp__original {
      font-family: var(--font-mono); font-size: var(--fs-xs);
      color: var(--ink-3); text-decoration: line-through;
    }
    .vp__badge { font-size: 10px; padding: 2px 6px; }
    .vp__iva {
      font-family: var(--font-mono); font-size: var(--fs-2xs);
      color: var(--ink-3); letter-spacing: .02em;
    }
    /* Tamaño grande para el rail de precio */
    :host(.vp--lg) .vp__main { font-size: var(--fs-data-lg); }
  `],
})
export class VayoPriceComponent {
  readonly price      = input.required<number>();
  readonly offerPrice = input<number | null>(null);

  readonly hasOffer = computed(() => {
    const op = this.offerPrice();
    return op != null && op > 0 && op < this.price();
  });

  readonly activePrice = computed(() => this.hasOffer() ? this.offerPrice()! : this.price());

  readonly discountPct = computed(() => {
    if (!this.hasOffer()) return 0;
    return Math.round((1 - this.offerPrice()! / this.price()) * 100);
  });

  fmt(n: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency', currency: 'CLP', minimumFractionDigits: 0,
    }).format(n);
  }
}
