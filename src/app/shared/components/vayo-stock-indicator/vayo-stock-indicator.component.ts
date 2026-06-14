import { Component, computed, input } from '@angular/core';

type AvailabilityStatus = 'in_stock' | 'out_of_stock' | 'on_request' | 'discontinued';

const CONFIG: Record<AvailabilityStatus, { label: string; css: string }> = {
  in_stock:     { label: 'En stock',        css: 'badge--ok'     },
  out_of_stock: { label: 'Sin stock',       css: 'badge--danger' },
  on_request:   { label: 'Bajo pedido',     css: 'badge--warn'   },
  discontinued: { label: 'Discontinuado',   css: 'badge--soft'   },
};

@Component({
  selector: 'vayo-stock-indicator',
  standalone: true,
  template: `
    <span class="badge" [class]="cfg().css">
      <span class="dot" aria-hidden="true"></span>
      {{ cfg().label }}
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; }
  `],
})
export class VayoStockIndicatorComponent {
  readonly status = input.required<string>();

  readonly cfg = computed(() =>
    CONFIG[this.status() as AvailabilityStatus] ?? { label: this.status(), css: 'badge--soft' }
  );
}
