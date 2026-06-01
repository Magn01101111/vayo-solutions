import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private readonly cacheService   = inject(CacheService);
  qs = inject(QuotationService);

  private readonly destroy$ = new Subject<void>();

  /** Productos destacados (marcados por el admin) que se muestran en la portada. */
  featured: ProductCardData[] = [];
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

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      categoriesResponse: this.catalogService.getCategories(),
      featuredResponse:   this.catalogService.getFeaturedProducts(),
    }).subscribe({
      next: ({ categoriesResponse, featuredResponse }) => {
        this.categories = categoriesResponse.data.map(mapApiCategoryToCatalogCategory);

        this.featured = featuredResponse.data.map((product) => {
          const category = this.categories.find((c) => c.id === product.categoryId);
          return mapApiProductToCardData(
            product,
            category ? { name: category.label, slug: category.slug } : undefined,
          );
        });

        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar la portada.';
        this.isLoading = false;
      },
    });
  }
}
