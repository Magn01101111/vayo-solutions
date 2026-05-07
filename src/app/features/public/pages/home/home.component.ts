import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, forkJoin, takeUntil, filter } from 'rxjs';
import { mapApiCategoryToCatalogCategory, mapApiProductToCardData } from '../../../public/mapper';
import {
  CatalogCategory,
  ProductCardData,
  StepItem,
} from '../../../../core/models/ui.models';
import { CatalogService } from '../../../../core/services/catalog.service';
import { CacheService }   from '../../../../core/services/cache.service';
import { QuotationService } from '../../../../core/services/quotation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private readonly cacheService   = inject(CacheService);
  qs = inject(QuotationService);

  private readonly destroy$ = new Subject<void>();
  categories: CatalogCategory[] = [
    { id: 'all', label: 'Todos', slug: 'all', active: true },
  ];

  products: ProductCardData[] = [];
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

  selectedCategory = 'Todos';
  searchQuery      = '';

  ngOnInit(): void {
    this.loadCatalogData();

    // Si admin crea/edita/desactiva productos o categorías (incluso desde
    // OTRA pestaña), recargamos automáticamente.
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

  get filteredProducts(): ProductCardData[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.products.filter((product) => {
      // Filtro por categoría
      const categoryMatch =
        this.selectedCategory === 'Todos' ||
        product.category === this.selectedCategory;

      if (!categoryMatch) return false;

      // Filtro por búsqueda (nombre, SKU, marca, descripción)
      if (!query) return true;

      const haystack = [
        product.name,
        product.sku,
        product.description ?? '',
        product.category,
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  get filteredProductsCount(): number {
    return this.filteredProducts.length;
  }

  selectCategory(categoryLabel: string): void {
    this.selectedCategory = categoryLabel;
  }

  isCategoryActive(category: CatalogCategory): boolean {
    return category.label === this.selectedCategory;
  }

  trackByLabel(_: number, item: CatalogCategory): string {
    return item.id;
  }

  trackByProduct(_: number, item: ProductCardData): string {
    return item.id;
  }

  trackByStep(_: number, item: StepItem): number {
    return item.number;
  }

  private loadCatalogData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      categoriesResponse: this.catalogService.getCategories(),
      productsResponse: this.catalogService.getProducts(),
    }).subscribe({
      next: ({ categoriesResponse, productsResponse }) => {
        const mappedCategories = categoriesResponse.data.map(
          mapApiCategoryToCatalogCategory
        );

        this.categories = [
          { id: 'all', label: 'Todos', slug: 'all', active: true },
          ...mappedCategories,
        ];

        this.products = productsResponse.data.map((product) => {
          const category = this.categories.find(
            (item) => item.id === product.categoryId
          );

          return mapApiProductToCardData(
            product,
            category
              ? { name: category.label, slug: category.slug }
              : undefined
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
