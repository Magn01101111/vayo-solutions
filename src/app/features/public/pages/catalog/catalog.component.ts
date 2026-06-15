import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin, takeUntil, filter, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { mapApiCategoryToCatalogCategory, mapApiProductToCardData } from '../../mapper';
import { CatalogCategory, ProductCardData } from '../../../../core/models/ui.models';
import { CatalogService }   from '../../../../core/services/catalog.service';
import { FavoriteService }  from '../../../../core/services/favorite.service';
import { CacheService }     from '../../../../core/services/cache.service';
import { QuotationService } from '../../../../core/services/quotation.service';
import { IconComponent }    from '../../../../shared/components/icon/icon.component';
import { VayoPaginationComponent } from '../../../../shared/components/vayo-pagination/vayo-pagination.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, VayoPaginationComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit, OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private readonly cacheService   = inject(CacheService);
  private readonly route          = inject(ActivatedRoute);
  qs = inject(QuotationService);
  favSvc = inject(FavoriteService);

  private readonly destroy$ = new Subject<void>();
  private readonly search$  = new Subject<string>();

  private pendingCategorySlug: string | null = null;

  categories: CatalogCategory[] = [{ id: 'all', label: 'Todos', slug: 'all', active: true }];
  products: ProductCardData[] = [];
  isLoading    = false;
  errorMessage = '';

  selectedCategory = 'Todos';
  searchQuery      = '';

  // Paginación
  currentPage = signal(1);
  totalPages  = signal(1);
  totalProducts = signal(0);
  readonly pageSize = 12;

  // Orden y filtros
  sortBy = signal<string>('newest');
  onlyOffers = signal(false);

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

    this.search$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
      )
      .subscribe((q) => this.doServerSearch(q));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.currentPage.set(1);
    this.search$.next(value);
  }

  selectCategory(label: string): void {
    this.selectedCategory = label;
    this.currentPage.set(1);
    if (this.searchQuery.trim()) {
      this.doServerSearch(this.searchQuery);
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pageCount) return;
    this.currentPage.set(page);
    if (this.searchQuery.trim()) {
      this.doServerSearch(this.searchQuery);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage.set(1);
    this.loadCatalogData();
  }

  doSearch(): void {
    if (this.searchQuery.trim()) {
      this.doServerSearch(this.searchQuery);
    } else {
      this.loadCatalogData();
    }
  }

  trackByLabel(_: number, item: CatalogCategory): string { return item.id; }
  trackByProduct(_: number, item: ProductCardData): string { return item.id; }

  stockBadgeClass(shortStatus: string): string {
    if (shortStatus === 'En stock')  return 'badge badge--ok';
    if (shortStatus === 'A pedido')  return 'badge badge--warn';
    if (shortStatus === 'Sin stock') return 'badge badge--danger';
    return 'badge badge--soft';
  }

  isCategoryActive(category: CatalogCategory): boolean {
    return category.label === this.selectedCategory;
  }

  /**
   * Productos a mostrar en la grilla.
   * - Si hay búsqueda activa, el backend ya filtró por texto + categoría → se
   *   muestran tal cual `products`.
   * - Si NO hay búsqueda, filtramos localmente por la categoría seleccionada
   *   (el listado completo ya está en memoria desde `loadCatalogData`).
   */
  get filteredProducts(): ProductCardData[] {
    let list = this.products;

    // Categoría (con búsqueda el backend ya filtró por categoría)
    if (!this.searchQuery.trim() && this.selectedCategory !== 'Todos') {
      list = list.filter((p) => p.category === this.selectedCategory);
    }

    // "Solo ofertas": únicamente productos con precio de oferta REAL.
    // Esto excluye los ítems "Consultar"/sin precio (no tienen offerPrice).
    if (this.onlyOffers()) {
      list = list.filter((p) => !!p.offerPrice);
    }

    return list;
  }

  /** Total de páginas: servidor (búsqueda) o cálculo local (catálogo completo). */
  get pageCount(): number {
    return this.searchQuery.trim()
      ? this.totalPages()
      : Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  /** Productos de la página actual. En búsqueda el backend ya paginó. */
  get displayedProducts(): ProductCardData[] {
    if (this.searchQuery.trim()) return this.filteredProducts;
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  private doServerSearch(q: string): void {
    if (!q.trim()) {
      this.loadCatalogData();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    const categorySlug = this.selectedCategory !== 'Todos'
      ? this.categories.find((c) => c.label === this.selectedCategory)?.slug
      : undefined;

    this.catalogService.searchProducts({
      q: q.trim(),
      category: categorySlug,
      page: this.currentPage(),
      limit: this.pageSize,
      sort: this.sortBy(),
      onOffer: this.onlyOffers() ? 'true' : undefined,
    }).subscribe({
      next: (res) => {
        if (res.ok && res.data) {
          const data = res.data;
          this.products = (data.products || []).map((product) => {
            const category = this.categories.find((c) => c.id === product.categoryId);
            return mapApiProductToCardData(
              product,
              category ? { name: category.label, slug: category.slug } : undefined,
            );
          });
          this.totalPages.set(data.pages || 1);
          this.totalProducts.set(data.total || 0);
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error al buscar productos.';
        this.isLoading = false;
      },
    });
  }

  private loadCatalogData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      categoriesResponse: this.catalogService.getCategories(),
      productsResponse:   this.catalogService.getProducts(),
    }).subscribe({
      next: ({ categoriesResponse, productsResponse }) => {
        const mapped = categoriesResponse.data.map(mapApiCategoryToCatalogCategory);
        this.categories = [{ id: 'all', label: 'Todos', slug: 'all', active: true }, ...mapped];

        if (this.pendingCategorySlug) {
          const match = this.categories.find((c) => c.slug === this.pendingCategorySlug);
          if (match) this.selectedCategory = match.label;
          this.pendingCategorySlug = null;
        }

        this.products = productsResponse.data.map((product) => {
          const category = this.categories.find((c) => c.id === product.categoryId);
          return mapApiProductToCardData(
            product,
            category ? { name: category.label, slug: category.slug } : undefined,
          );
        });

        this.totalPages.set(1);
        this.totalProducts.set(this.products.length);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar el catálogo.';
        this.isLoading = false;
      },
    });
  }
}
