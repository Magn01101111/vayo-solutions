import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_PRODUCTS } from '../../../../core/data/mock.products';
import { Product } from '../../../../core/models/app.models';
import { CatalogCategory, StepItem } from '../../../../core/models/ui.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  categories: CatalogCategory[] = [
    { label: 'Todos', active: true },
    { label: 'Compresores', active: false },
    { label: 'Ventiladores', active: false },
    { label: 'Válvulas', active: false },
    { label: 'Sensores', active: false },
    { label: 'Filtros', active: false },
  ];

  readonly products: Product[] = MOCK_PRODUCTS.map((product) => ({
    id: product.id,
    category: product.category,
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: 'Consultar',
    imageUrl: product.imageUrl,
    inStock: product.inStock,
    icon: product.icon,
  }));

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

  get filteredProducts(): Product[] {
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

    this.categories = this.categories.map((category) => ({
      ...category,
      active: category.label === categoryLabel,
    }));
  }

  trackByLabel(_: number, item: CatalogCategory): string {
    return item.label;
  }

  trackByProduct(_: number, item: Product): string {
    return item.id;
  }

  trackByStep(_: number, item: StepItem): number {
    return item.number;
  }
}
