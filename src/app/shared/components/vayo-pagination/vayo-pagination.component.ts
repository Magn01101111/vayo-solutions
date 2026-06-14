import { Component, computed, input, output } from '@angular/core';

/**
 * Paginación numerada obligatoria. PROHIBIDO scroll infinito / "ver más".
 *
 * Uso básico:
 *   <vayo-pagination [page]="p" [total]="total" [pageSize]="12"
 *                    (pageChange)="p = $event" />
 *
 * Alternativa con pageCount:
 *   <vayo-pagination [page]="p" [pageCount]="pages" (pageChange)="p = $event" />
 */
@Component({
  selector: 'vayo-pagination',
  standalone: true,
  templateUrl: './vayo-pagination.component.html',
  styleUrl: './vayo-pagination.component.scss',
})
export class VayoPaginationComponent {
  readonly page      = input.required<number>();
  readonly pageCount = input<number | null>(null);
  readonly total     = input<number | null>(null);
  readonly pageSize  = input<number>(10);
  readonly pageChange = output<number>();

  readonly totalPages = computed(() => {
    const pc = this.pageCount();
    if (pc != null) return pc;
    const t = this.total();
    if (t == null) return 1;
    return Math.max(1, Math.ceil(t / this.pageSize()));
  });

  /** Números de página visibles con elipsis (…=-1) */
  readonly pages = computed<number[]>(() => {
    const total = this.totalPages();
    const cur   = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];
    if (cur > 3) pages.push(-1); // elipsis izquierda

    const start = Math.max(2, cur - 1);
    const end   = Math.min(total - 1, cur + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (cur < total - 2) pages.push(-1); // elipsis derecha
    pages.push(total);
    return pages;
  });

  go(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.pageChange.emit(page);
  }
}
