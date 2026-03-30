import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MOCK_PRODUCTS } from '../../../../core/data/mock.products';
import {
  ProductDetailData,
  ProductProvider,
  ProductReview,
  ProductTab,
  ProductTabItem,
  RelatedProduct,
} from '../../../../core/models/ui.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  activeTab: ProductTab = 'specs';
  quantity = 1;
  currentProductId = '';

  product: ProductDetailData | null = null;

  readonly reviews: ProductReview[] = [
    {
      author: 'DataCenter Pro',
      date: '12 mar 2025',
      rating: 5,
      body:
        'Excelente repuesto, llegó en perfectas condiciones y en el plazo prometido. Instalamos en nuestro equipo y funcionó a la primera.',
      tags: ['Envío rápido', 'Calidad original', 'Fácil instalación'],
      verified: true,
      initials: 'DC',
    },
    {
      author: 'Marcela G.',
      company: 'TechCorp S.A.',
      date: '28 ene 2025',
      rating: 4,
      body:
        'Buen producto, cumple con las especificaciones. El equipo quedó funcionando correctamente.',
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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (!id) {
        this.router.navigate(['/catalogo']);
        return;
      }

      this.currentProductId = id;
      this.loadProduct(id);
      this.quantity = 1;
      this.activeTab = 'specs';
    });
  }

  get unitPrice(): number {
    return typeof this.product?.price === 'number' ? this.product.price : 0;
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

  get relatedProducts(): RelatedProduct[] {
    return MOCK_PRODUCTS
      .filter((item) => item.id !== this.currentProductId)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        icon: item.icon,
      }));
  }

  loadProduct(id: string): void {
    const foundProduct = MOCK_PRODUCTS.find((item) => item.id === id);
    this.product = foundProduct ?? null;
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
}
