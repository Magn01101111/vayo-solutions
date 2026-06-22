import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
  qs = inject(QuotationService);

  showWelcomeBanner = signal(WelcomeBannerComponent.shouldShow(this.authSvc));

  private readonly destroy$ = new Subject<void>();

  /** Productos destacados (marcados por el admin). */
  featured: ProductCardData[] = [];
  /** Productos en oferta vigente. */
  offers: ProductCardData[] = [];
  /** Banners promocionales activos. */
  banners: ApiBanner[] = [];
  /** Categorías para la sección "explora por categoría". */
  categories: CatalogCategory[] = [];

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

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      categoriesResponse: this.catalogService.getCategories(),
      featuredResponse:   this.catalogService.getFeaturedProducts(),
      offersResponse:     this.catalogService.getOffers(),
      bannersResponse:    this.apiService.get<{ ok: boolean; data: ApiBanner[] }>(API_CONFIG.endpoints.banners),
    }).subscribe({
      next: ({ categoriesResponse, featuredResponse, offersResponse, bannersResponse }) => {
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

        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar la portada.';
        this.isLoading = false;
      },
    });
  }
}
