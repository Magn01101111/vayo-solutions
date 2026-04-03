import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  mapApiProductDetailToProductDetailData,
  mapApiProductToRelatedProduct,
} from '../../mapper';
import {
  ProductDetailData,
  ProductProvider,
  ProductReview,
  ProductTab,
  ProductTabItem,
  RelatedProduct,
} from '../../../../core/models/ui.models';
import { CatalogService } from '../../../../core/services/catalog.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);

  activeTab: ProductTab = 'specs';
  quantity = 1;
  currentProductId = '';

  product: ProductDetailData | null = null;
  relatedProducts: RelatedProduct[] = [];
  isLoading = false;
  errorMessage = '';

  readonly reviews: ProductReview[] = [
    {
      author: 'DataCenter Pro',
      date: '12 mar 2025',
      rating: 5,
      body: 'Excelente repuesto, llegó en perfectas condiciones y en el plazo prometido. Instalamos en nuestro equipo y funcionó a la primera.',
      tags: ['Envío rápido', 'Calidad original', 'Fácil instalación'],
      verified: true,
      initials: 'DC',
    },
    {
      author: 'Marcela G.',
      company: 'TechCorp S.A.',
      date: '28 ene 2025',
      rating: 4,
      body: 'Buen producto, cumple con las especificaciones. El equipo quedó funcionando correctamente.',
      tags: ['Buen producto', 'Precio justo'],
      verified: true,
      initials: 'MG',
    },
  ];

  readonly providers: ProductProvider[] = [
    {
      name: 'TechParts Chile',
      location: 'Santiago',
      deliveryTime: '2–3 días',
      speed: 'fast',
    },
    {
      name: 'FríoRepuestos S.A.',
      location: 'Valparaíso',
      deliveryTime: '4–6 días',
      speed: 'mid',
    },
    {
      name: 'CoolTech Austral',
      location: 'Concepción',
      deliveryTime: '5–7 días',
      speed: 'mid',
    },
  ];

  readonly tabList: ProductTabItem[] = [
    { key: 'specs', label: 'Especificaciones' },
    { key: 'dimensions', label: 'Dimensiones' },
    { key: 'compatibility', label: 'Compatibilidad' },
    { key: 'documents', label: 'Documentos' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (!id) {
        this.router.navigate(['/catalogo']);
        return;
      }

      this.currentProductId = id;
      this.quantity = 1;
      this.activeTab = 'specs';

      this.loadProduct(id);
      this.loadRelatedProducts(id);
    });
  }

  get unitPrice(): number {
    if (!this.product?.price || this.product.price === 'Consultar') {
      return 0;
    }

    return Number(this.product.price.replace(/[^\d]/g, '')) || 0;
  }

  get subtotal(): number {
    return this.unitPrice * this.quantity;
  }

  get iva(): number {
    return Math.round(this.subtotal * 0.19);
  }

  get total(): number {
    return this.subtotal + this.iva;
  }

  get specs() {
    return this.product?.specs ?? [];
  }

  get compatibility() {
    return this.product?.compatibility ?? [];
  }

  get documents() {
    return this.product?.documents ?? [];
  }

  setTab(tab: ProductTab): void {
    this.activeTab = tab;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQuantity(): void {
    if (this.quantity < 99) {
      this.quantity++;
    }
  }

  formatCurrency(value: number): string {
    return `$${value.toLocaleString('es-CL')}`;
  }

  isAvailableStatus(status: string): boolean {
    return status === 'En stock';
  }

  getStars(rating: number): boolean[] {
    const filledStars = Math.round(rating);
    return Array.from({ length: 5 }, (_, index) => index < filledStars);
  }

  trackByReview(_: number, item: ProductReview): string {
    return `${item.author}-${item.date}`;
  }

  trackByProvider(_: number, item: ProductProvider): string {
    return item.name;
  }

  trackByRelated(_: number, item: RelatedProduct): string {
    return item.id;
  }

  trackByTab(_: number, item: ProductTabItem): string {
    return item.key;
  }

  trackBySpec(_: number, item: { label: string }): string {
    return item.label;
  }

  trackByDoc(_: number, item: { title: string }): string {
    return item.title;
  }

  private loadProduct(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.product = null;

    this.catalogService.getProductById(id).subscribe({
      next: (response) => {
        this.product = mapApiProductDetailToProductDetailData(response.data);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar el detalle del producto.';
        this.isLoading = false;
      },
    });
  }

  private loadRelatedProducts(currentId: string): void {
    this.catalogService.getProducts().subscribe({
      next: (response) => {
        this.relatedProducts = response.data
          .filter((item) => item.id !== currentId)
          .slice(0, 3)
          .map((item) => mapApiProductToRelatedProduct(item));
      },
      error: () => {
        this.relatedProducts = [];
      },
    });
  }
}
