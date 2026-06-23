import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin, takeUntil, filter } from 'rxjs';
import { mapApiCategoryToCatalogCategory, mapApiProductToCardData } from '../../mapper';
import { CatalogCategory, ProductCardData } from '../../../../core/models/ui.models';
import { CatalogService }   from '../../../../core/services/catalog.service';
import { BehaviorService }  from '../../../../core/services/behavior.service';
import { FavoriteService }  from '../../../../core/services/favorite.service';
import { CacheService }     from '../../../../core/services/cache.service';
import { QuotationService } from '../../../../core/services/quotation.service';
import { IconComponent }    from '../../../../shared/components/icon/icon.component';
import { VayoPaginationComponent } from '../../../../shared/components/vayo-pagination/vayo-pagination.component';

const MAX_COMPARE = 4;

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, VayoPaginationComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit, OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private readonly behavior       = inject(BehaviorService);
  private readonly cacheService   = inject(CacheService);
  private readonly route          = inject(ActivatedRoute);
  qs = inject(QuotationService);
  favSvc = inject(FavoriteService);

  private readonly destroy$ = new Subject<void>();
  private pendingCategorySlug: string | null = null;

  categories: CatalogCategory[] = [];
  /** Lista completa en memoria; todo el filtrado es client-side (F4-2). */
  private allProducts: ProductCardData[] = [];
  isLoading    = false;
  errorMessage = '';

  // ── Filtros (todos reactivos vía signals) ──────────────────────────────────
  searchQuery = signal('');
  /** Slugs de categoría seleccionados (vacío = todas). */
  selectedCategories = signal<Set<string>>(new Set());
  /** Estados de disponibilidad seleccionados (vacío = todos). */
  selectedAvailability = signal<Set<string>>(new Set());
  onlyOffers  = signal(false);
  priceMin    = signal<number | null>(null);
  priceMax    = signal<number | null>(null);
  sortBy      = signal<string>('newest');

  // Paginación
  currentPage = signal(1);
  readonly pageSize = 12;

  // Comparador
  compareIds  = signal<Set<string>>(new Set());
  compareOpen = signal(false);
  compareLimitHit = signal(false);

  /** Estados disponibles para el filtro (etiquetas visibles + valor interno). */
  readonly availabilityOptions = [
    { value: 'En stock', label: 'En stock' },
    { value: 'A pedido', label: 'A pedido' },
    { value: 'Sin stock', label: 'Sin stock' },
  ];

  ngOnInit(): void {
    this.pendingCategorySlug = this.route.snapshot.queryParamMap.get('categoria');
    this.loadCatalogData();

    this.cacheService.invalidations$
      .pipe(
        takeUntil(this.destroy$),
        filter((ev) =>
          ev.kind === 'all' ||
          (ev.kind === 'prefix' && (ev.value === 'products:' || ev.value === 'categories:')),
        ),
      )
      .subscribe(() => this.loadCatalogData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Handlers de filtros ─────────────────────────────────────────────────────

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  toggleCategory(slug: string): void {
    const next = new Set(this.selectedCategories());
    next.has(slug) ? next.delete(slug) : next.add(slug);
    this.selectedCategories.set(next);
    this.currentPage.set(1);
    if (next.has(slug)) this.behavior.trackCategory(slug); // F3-1
  }

  toggleAvailability(value: string): void {
    const next = new Set(this.selectedAvailability());
    next.has(value) ? next.delete(value) : next.add(value);
    this.selectedAvailability.set(next);
    this.currentPage.set(1);
  }

  setSort(value: string): void {
    this.sortBy.set(value);
    this.currentPage.set(1);
  }

  toggleOffers(value: boolean): void {
    this.onlyOffers.set(value);
    this.currentPage.set(1);
  }

  onPriceMin(value: string): void {
    this.priceMin.set(value ? Number(value) : null);
    this.currentPage.set(1);
  }

  onPriceMax(value: string): void {
    this.priceMax.set(value ? Number(value) : null);
    this.currentPage.set(1);
  }

  /** Nº de filtros activos (para el botón "Limpiar filtros"). */
  activeFilterCount = computed(() => {
    let n = 0;
    if (this.searchQuery().trim()) n++;
    n += this.selectedCategories().size;
    n += this.selectedAvailability().size;
    if (this.onlyOffers()) n++;
    if (this.priceMin() != null) n++;
    if (this.priceMax() != null) n++;
    return n;
  });

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.selectedCategories.set(new Set());
    this.selectedAvailability.set(new Set());
    this.onlyOffers.set(false);
    this.priceMin.set(null);
    this.priceMax.set(null);
    this.currentPage.set(1);
  }

  isCategorySelected(slug: string): boolean {
    return this.selectedCategories().has(slug);
  }

  isAvailabilitySelected(value: string): boolean {
    return this.selectedAvailability().has(value);
  }

  // ── Resultado filtrado + orden ──────────────────────────────────────────────

  filtered = computed<ProductCardData[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cats = this.selectedCategories();
    const avail = this.selectedAvailability();
    const offers = this.onlyOffers();
    const min = this.priceMin();
    const max = this.priceMax();

    let list = this.allProducts.filter((p) => {
      // Texto (nombre, SKU, categoría)
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // Categoría (multi)
      if (cats.size > 0 && !cats.has(p.categorySlug)) return false;
      // Disponibilidad (multi)
      if (avail.size > 0 && !avail.has(p.shortStatus)) return false;
      // Solo ofertas
      if (offers && !p.offerPrice) return false;
      // Rango de precio (usa precio de oferta si existe, si no el normal)
      const eff = p.offerPriceRaw ?? p.priceRaw ?? null;
      if (min != null) { if (eff == null || eff < min) return false; }
      if (max != null) { if (eff == null || eff > max) return false; }
      return true;
    });

    // Orden
    const sort = this.sortBy();
    if (sort === 'price_asc' || sort === 'price_desc') {
      const dir = sort === 'price_asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        const pa = a.offerPriceRaw ?? a.priceRaw ?? Number.MAX_SAFE_INTEGER;
        const pb = b.offerPriceRaw ?? b.priceRaw ?? Number.MAX_SAFE_INTEGER;
        return (pa - pb) * dir;
      });
    } else if (sort === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
    // 'newest' = orden de llegada del backend (ya viene por recencia)

    return list;
  });

  resultCount = computed(() => this.filtered().length);

  pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  displayedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  /** Conteo de productos por categoría (slug → n) para el panel lateral. */
  categoryCounts = computed(() => {
    const map = new Map<string, number>();
    for (const p of this.allProducts) {
      map.set(p.categorySlug, (map.get(p.categorySlug) ?? 0) + 1);
    }
    return map;
  });

  countForCategory(slug: string): number {
    return this.categoryCounts().get(slug) ?? 0;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pageCount()) return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Comparador ──────────────────────────────────────────────────────────────

  toggleCompare(id: string): void {
    const next = new Set(this.compareIds());
    if (next.has(id)) {
      next.delete(id);
      this.compareLimitHit.set(false);
    } else {
      if (next.size >= MAX_COMPARE) {
        this.compareLimitHit.set(true);
        return;
      }
      next.add(id);
    }
    this.compareIds.set(next);
  }

  isComparing(id: string): boolean {
    return this.compareIds().has(id);
  }

  compareItems = computed<ProductCardData[]>(() => {
    const ids = this.compareIds();
    return this.allProducts.filter((p) => ids.has(p.id));
  });

  clearCompare(): void {
    this.compareIds.set(new Set());
    this.compareOpen.set(false);
    this.compareLimitHit.set(false);
  }

  openCompare(): void {
    if (this.compareIds().size >= 2) this.compareOpen.set(true);
  }

  closeCompare(): void {
    this.compareOpen.set(false);
  }

  // ── Helpers de UI ───────────────────────────────────────────────────────────

  stockBadgeClass(shortStatus: string): string {
    if (shortStatus === 'En stock')  return 'badge badge--ok';
    if (shortStatus === 'A pedido')  return 'badge badge--warn';
    if (shortStatus === 'Sin stock') return 'badge badge--danger';
    return 'badge badge--soft';
  }

  trackByLabel(_: number, item: CatalogCategory): string { return item.id; }
  trackByProduct(_: number, item: ProductCardData): string { return item.id; }

  // ── Carga ───────────────────────────────────────────────────────────────────

  private loadCatalogData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      categoriesResponse: this.catalogService.getCategories(),
      productsResponse:   this.catalogService.getProducts(),
    }).subscribe({
      next: ({ categoriesResponse, productsResponse }) => {
        this.categories = categoriesResponse.data.map(mapApiCategoryToCatalogCategory);

        if (this.pendingCategorySlug) {
          const match = this.categories.find((c) => c.slug === this.pendingCategorySlug);
          if (match) this.selectedCategories.set(new Set([match.slug]));
          this.pendingCategorySlug = null;
        }

        this.allProducts = productsResponse.data.map((product) => {
          const category = this.categories.find((c) => c.id === product.categoryId);
          return mapApiProductToCardData(
            product,
            category ? { name: category.label, slug: category.slug } : undefined,
          );
        });

        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar el catálogo.';
        this.isLoading = false;
      },
    });
  }
}
