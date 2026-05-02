import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { RouterLink }   from '@angular/router';
import { forkJoin }     from 'rxjs';

import {
  mapApiCategoryToCatalogCategory,
  mapApiProductToCardData,
} from '../../mapper';
import {
  CatalogCategory,
  ProductCardData,
} from '../../../../core/models/ui.models';
import { CatalogService }   from '../../../../core/services/catalog.service';
import { QuotationService } from '../../../../core/services/quotation.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  qs = inject(QuotationService);

  categories: CatalogCategory[] = [
    { id: 'all', label: 'Todos', slug: 'all', active: true },
  ];
  products: ProductCardData[] = [];
  isLoading    = false;
  errorMessage = '';

  selectedCategory = 'Todos';
  searchQuery      = '';

  ngOnInit(): void {
    this.loadCatalogData();
  }

  get filteredProducts(): ProductCardData[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.products.filter((p) => {
      const categoryMatch =
        this.selectedCategory === 'Todos' || p.category === this.selectedCategory;
      if (!categoryMatch) return false;
      if (!query) return true;
      const haystack = [p.name, p.sku, p.description ?? '', p.category]
        .join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  selectCategory(label: string): void {
    this.selectedCategory = label;
  }

  isCategoryActive(category: CatalogCategory): boolean {
    return category.label === this.selectedCategory;
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  trackByLabel(_: number, item: CatalogCategory): string { return item.id; }
  trackByProduct(_: number, item: ProductCardData): string { return item.id; }

  private loadCatalogData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      categoriesResponse: this.catalogService.getCategories(),
      productsResponse:   this.catalogService.getProducts(),
    }).subscribe({
      next: ({ categoriesResponse, productsResponse }) => {
        const mapped = categoriesResponse.data.map(mapApiCategoryToCatalogCategory);

        this.categories = [
          { id: 'all', label: 'Todos', slug: 'all', active: true },
          ...mapped,
        ];

        this.products = productsResponse.data.map((product) => {
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
