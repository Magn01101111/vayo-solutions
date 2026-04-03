import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { mapApiCategoryToCatalogCategory, mapApiProductToCardData } from '../../../public/mapper';
import {
  CatalogCategory,
  ProductCardData,
  StepItem,
} from '../../../../core/models/ui.models';
import { CatalogService } from '../../../../core/services/catalog.service';
import { QuotationService } from '../../../../core/services/quotation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  qs = inject(QuotationService);
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

  ngOnInit(): void {
    this.loadCatalogData();
  }

  get filteredProducts(): ProductCardData[] {
    if (this.selectedCategory === 'Todos') {
      return this.products;
    }

    return this.products.filter(
      (product) => product.category === this.selectedCategory
    );
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
