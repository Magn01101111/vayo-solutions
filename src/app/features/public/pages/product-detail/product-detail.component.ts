// product-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { QuotationService } from '../../../../core/services/quotation.service';

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
  private qs = inject(QuotationService);

  activeTab: ProductTab = 'specs';
  quantity = signal(1);
  currentProductId = '';
  showAddToCartFeedback = signal(false);
  feedbackMessage = signal('');

  product = signal<ProductDetailData | null>(null);
  relatedProducts = signal<RelatedProduct[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  // Computed signals para precios
  unitPrice = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct?.price || currentProduct.price === 'Consultar') {
      return 0;
    }
    return Number(currentProduct.price.replace(/[^\d]/g, '')) || 0;
  });

  subtotal = computed(() => this.unitPrice() * this.quantity());
  iva = computed(() => Math.round(this.subtotal() * 0.19));
  total = computed(() => this.subtotal() + this.iva());

  // Verificar si el producto ya está en el carrito
  isInCart = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct) return false;
    return this.qs.items().some((item) => item.id === currentProduct.id);
  });

  // Obtener cantidad actual en carrito
  currentCartQty = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct) return 0;
    const cartItem = this.qs
      .items()
      .find((item) => item.id === currentProduct.id);
    return cartItem?.qty || 0;
  });

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
      this.quantity.set(1);
      this.activeTab = 'specs';
      this.showAddToCartFeedback.set(false);

      this.loadProduct(id);
      this.loadRelatedProducts(id);
    });
  }

  addToQuote(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    // Agregar la cantidad seleccionada
    for (let i = 0; i < this.quantity(); i++) {
      this.qs.addItem({
        id: currentProduct.id,
        name: currentProduct.name,
        sku: currentProduct.sku,
        price: currentProduct.price,
        category: currentProduct.category,
        categorySlug: currentProduct.categorySlug,
        imageUrl: currentProduct.imageUrl,
        shortStatus: currentProduct.shortStatus,
        stockLabel: currentProduct.stockLabel,
        icon: currentProduct.icon,
        tags: currentProduct.tags,
      });
    }

    // Mostrar feedback
    this.showFeedback(
      `✓ ${this.quantity()} x ${currentProduct.name} agregado${this.quantity() > 1 ? 's' : ''} al carrito`,
      'success',
    );

    // Resetear cantidad después de agregar
    this.quantity.set(1);
  }

  addSingleToCart(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    this.qs.addItem({
      id: currentProduct.id,
      name: currentProduct.name,
      sku: currentProduct.sku,
      price: currentProduct.price,
      category: currentProduct.category,
      categorySlug: currentProduct.categorySlug,
      imageUrl: currentProduct.imageUrl,
      shortStatus: currentProduct.shortStatus,
      stockLabel: currentProduct.stockLabel,
      icon: currentProduct.icon,
      tags: currentProduct.tags,
    });

    this.showFeedback(
      `✓ ${currentProduct.name} agregado al carrito`,
      'success',
    );
  }

  updateCartQuantity(newQty: number): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const currentQty = this.currentCartQty();

    if (newQty > currentQty) {
      // Agregar items
      const diff = newQty - currentQty;
      for (let i = 0; i < diff; i++) {
        this.qs.addItem({
          id: currentProduct.id,
          name: currentProduct.name,
          sku: currentProduct.sku,
          price: currentProduct.price,
          category: currentProduct.category,
          categorySlug: currentProduct.categorySlug,
          imageUrl: currentProduct.imageUrl,
          shortStatus: currentProduct.shortStatus,
          stockLabel: currentProduct.stockLabel,
          icon: currentProduct.icon,
          tags: currentProduct.tags,
        });
      }
      this.showFeedback(
        `✓ Cantidad actualizada a ${newQty} unidades`,
        'success',
      );
    } else if (newQty < currentQty) {
      // Remover items
      const diff = currentQty - newQty;
      for (let i = 0; i < diff; i++) {
        this.qs.removeItem(currentProduct.id);
      }
      this.showFeedback(`✓ Cantidad actualizada a ${newQty} unidades`, 'info');
    }
  }

  removeFromCart(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    this.qs.removeItem(currentProduct.id);
    this.showFeedback(`✗ ${currentProduct.name} eliminado del carrito`, 'info');
  }

  private showFeedback(
    message: string,
    type: 'success' | 'info' | 'error' = 'success',
  ): void {
    this.feedbackMessage.set(message);
    this.showAddToCartFeedback.set(true);

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      this.showAddToCartFeedback.set(false);
    }, 3000);
  }

  setTab(tab: ProductTab): void {
    this.activeTab = tab;
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  increaseQuantity(): void {
    if (this.quantity() < 99) {
      this.quantity.update((q) => q + 1);
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
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.product.set(null);

    this.catalogService.getProductById(id).subscribe({
      next: (response) => {
        this.product.set(mapApiProductDetailToProductDetailData(response.data));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No fue posible cargar el detalle del producto.');
        this.isLoading.set(false);
      },
    });
  }

  private loadRelatedProducts(currentId: string): void {
    this.catalogService.getProducts().subscribe({
      next: (response) => {
        this.relatedProducts.set(
          response.data
            .filter((item) => item.id !== currentId)
            .slice(0, 3)
            .map((item) => mapApiProductToRelatedProduct(item)),
        );
      },
      error: () => {
        this.relatedProducts.set([]);
      },
    });
  }
}
