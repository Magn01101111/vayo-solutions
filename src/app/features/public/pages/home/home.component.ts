import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, forkJoin, takeUntil, filter } from 'rxjs';

import { mapApiCategoryToCatalogCategory, mapApiProductToCardData } from '../../../public/mapper';
import {
  CatalogCategory,
  ProductCardData,
  StepItem,
} from '../../../../core/models/ui.models';
import { CatalogService } from '../../../../core/services/catalog.service';
import { CacheService } from '../../../../core/services/cache.service';
import { QuotationService } from '../../../../core/services/quotation.service';
import { ApiService } from '../../../../core/services/api.service';
import { API_CONFIG } from '../../../../core/config/api.config';
import { ApiBanner } from '../../../../core/models/api.models';
import { AuthService } from '../../../../core/services/auth.service';
import { BehaviorService } from '../../../../core/services/behavior.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { WelcomeBannerComponent } from '../../../../shared/components/welcome-banner/welcome-banner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, WelcomeBannerComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private readonly cacheService   = inject(CacheService);
  private readonly apiService     = inject(ApiService);
  private readonly authSvc        = inject(AuthService);
  private readonly behavior       = inject(BehaviorService);
  qs = inject(QuotationService);

  showWelcomeBanner = signal(WelcomeBannerComponent.shouldShow(this.authSvc));

  private readonly destroy$ = new Subject<void>();

  /** Productos destacados (marcados por el admin). */
  featured: ProductCardData[] = [];
  /** Productos en oferta vigente. */
  offers: ProductCardData[] = [];
  /** Recomendaciones personalizadas según el comportamiento (F3-2). */
  recommended: ProductCardData[] = [];
  /** Banners promocionales activos. */
  banners: ApiBanner[] = [];
  /** Categorías para la sección "explora por categoría". */
  categories: CatalogCategory[] = [];
  categoryPage = signal(0);
  readonly categoryPageSize = 4;

  visibleCategories = computed(() => {
    const start = this.categoryPage() * this.categoryPageSize;
    return this.categories.slice(start, start + this.categoryPageSize);
  });
  canPrevCategory = computed(() => this.categoryPage() > 0);
  canNextCategory = computed(() => (this.categoryPage() + 1) * this.categoryPageSize < this.categories.length);

  isLoading = false;
  errorMessage = '';

  readonly steps: StepItem[] = [
    {
      number: 1,
      title: 'Navega el catálogo',
      description:
        'Explora repuestos por categoría o busca por referencia o nombre del producto.',
    },
    {
      number: 2,
      title: 'Solicita cotización',
      description:
        'Ingresa a la ficha del artículo, revisa compatibilidad y agrega el repuesto a tu solicitud.',
    },
    {
      number: 3,
      title: 'Recibe respuesta',
      description:
        'Tu solicitud se envía al equipo comercial para responder con disponibilidad y precio.',
    },
  ];

  readonly heroPills: string[] = [
    'Catálogo en línea',
    'Cotización descargable',
    'Respuesta rápida',
    'Sin cuenta necesaria',
  ];

  ngOnInit(): void {
    this.loadData();

    // Si admin marca/desmarca destacados o cambia productos (incluso en otra
    // pestaña), recargamos la portada automáticamente.
    this.cacheService.invalidations$
      .pipe(
        takeUntil(this.destroy$),
        filter((ev) =>
          ev.kind === 'all' ||
          (ev.kind === 'prefix' && (ev.value === 'products:' || ev.value === 'categories:')),
        ),
      )
      .subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByProduct(_: number, item: ProductCardData): string { return item.id; }
  trackByCategory(_: number, item: CatalogCategory): string { return item.id; }
  trackByStep(_: number, item: StepItem): number { return item.number; }

  prevCategoryPage(): void {
    if (this.canPrevCategory()) this.categoryPage.update((p) => p - 1);
  }

  nextCategoryPage(): void {
    if (this.canNextCategory()) this.categoryPage.update((p) => p + 1);
  }

  /** Clase de badge según disponibilidad (F4-1). */
  stockBadgeClass(shortStatus: string): string {
    if (shortStatus === 'En stock')  return 'badge badge--ok';
    if (shortStatus === 'A pedido')  return 'badge badge--warn';
    if (shortStatus === 'Sin stock') return 'badge badge--danger';
    return 'badge badge--soft';
  }

  /** "Ahorras $X" para ofertas (precio normal − precio oferta). null si no aplica. */
  savings(p: ProductCardData): string | null {
    if (p.priceRaw == null || p.offerPriceRaw == null) return null;
    const diff = p.priceRaw - p.offerPriceRaw;
    if (diff <= 0) return null;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
    }).format(diff);
  }

  /** Fecha de término de la oferta formateada (es-CL). */
  formatOfferEnd(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  }

  /**
   * F3-2: ordena el catálogo por afinidad con el comportamiento guardado.
   * Pondera categorías y tags preferidos; excluye los ya vistos recientemente
   * para sugerir piezas nuevas. Devuelve [] si no hay historial (la sección se
   * oculta y no queda un estado vacío feo).
   */
  private computeRecommended(products: ProductCardData[]): ProductCardData[] {
    const topCats = this.behavior.topCategories();
    const topTags = this.behavior.topTags();
    if (topCats.length === 0 && topTags.length === 0) return [];

    const recentIds = new Set(this.behavior.recent());
    const catRank = new Map(topCats.map((slug, i) => [slug, topCats.length - i]));
    const tagRank = new Map(topTags.map((tag, i) => [tag, topTags.length - i]));

    const scored = products
      .filter((p) => !recentIds.has(p.id))
      .map((p) => {
        const catScore = (catRank.get(p.categorySlug) ?? 0) * 3;
        const tagScore = (p.tags ?? []).reduce((acc, t) => acc + (tagRank.get(t) ?? 0), 0);
        return { p, score: catScore + tagScore };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 4).map((s) => s.p);
  }

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      categoriesResponse: this.catalogService.getCategories(),
      featuredResponse:   this.catalogService.getFeaturedProducts(),
      offersResponse:     this.catalogService.getOffers(),
      productsResponse:   this.catalogService.getProducts(),
      bannersResponse:    this.apiService.get<{ ok: boolean; data: ApiBanner[] }>(API_CONFIG.endpoints.banners),
    }).subscribe({
      next: ({ categoriesResponse, featuredResponse, offersResponse, productsResponse, bannersResponse }) => {
        this.categories = categoriesResponse.data.map(mapApiCategoryToCatalogCategory);

        this.featured = featuredResponse.data.map((product) => {
          const category = this.categories.find((c) => c.id === product.categoryId);
          return mapApiProductToCardData(
            product,
            category ? { name: category.label, slug: category.slug } : undefined,
          );
        });

        this.offers = offersResponse.data.map((product) => {
          const category = this.categories.find((c) => c.id === product.categoryId);
          return mapApiProductToCardData(
            product,
            category ? { name: category.label, slug: category.slug } : undefined,
          );
        });

        if (bannersResponse.ok && bannersResponse.data) {
          this.banners = bannersResponse.data.filter((b) => b.isActive).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }

        // F3-2: recomendaciones según historial de navegación.
        const allProducts = productsResponse.data.map((product) => {
          const category = this.categories.find((c) => c.id === product.categoryId);
          return mapApiProductToCardData(
            product,
            category ? { name: category.label, slug: category.slug } : undefined,
          );
        });
        this.recommended = this.computeRecommended(allProducts);

        // F4-1: conteo real de "N refs" por categoría para los tiles del Home.
        const refsBySlug = new Map<string, number>();
        for (const p of allProducts) {
          refsBySlug.set(p.categorySlug, (refsBySlug.get(p.categorySlug) ?? 0) + 1);
        }
        this.categories = this.categories.map((c) => ({
          ...c,
          refs: refsBySlug.get(c.slug) ?? 0,
        }));
        this.categoryPage.set(0);

        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar la portada.';
        this.isLoading = false;
      },
    });
  }
}
