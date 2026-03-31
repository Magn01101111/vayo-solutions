import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_PRODUCTS } from '../../../../core/data/mock.products';
import { mapApiProductToCardData } from '../../../public/mapper';
import {
  CatalogCategory,
  ProductCardData,
  StepItem,
} from '../../../../core/models/ui.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly categories: CatalogCategory[] = this.buildCategories();

  readonly products: ProductCardData[] = MOCK_PRODUCTS.map((product) =>
    mapApiProductToCardData(product, product.category)
  );

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

  private buildCategories(): CatalogCategory[] {
    const baseCategory: CatalogCategory = {
      id: 'all',
      label: 'Todos',
      slug: 'all',
      active: true,
    };

    const derivedCategories = Array.from(
      new Map(
        MOCK_PRODUCTS.map((product) => [
          product.category.id,
          {
            id: product.category.id,
            label: product.category.name,
            slug: product.category.slug,
            active: false,
          } satisfies CatalogCategory,
        ])
      ).values()
    );

    return [baseCategory, ...derivedCategories];
  }
}
