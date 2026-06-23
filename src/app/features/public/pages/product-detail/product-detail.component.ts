// product-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  mapApiProductDetailToProductDetailData,
  mapApiProductToCardData,
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
import { BehaviorService } from '../../../../core/services/behavior.service';
import { QuotationService } from '../../../../core/services/quotation.service';
import { IconComponent }                from '../../../../shared/components/icon/icon.component';
import { VayoPriceComponent }          from '../../../../shared/components/vayo-price/vayo-price.component';
import { VayoStockIndicatorComponent } from '../../../../shared/components/vayo-stock-indicator/vayo-stock-indicator.component';
import { VayoQuantityStepperComponent } from '../../../../shared/components/vayo-quantity-stepper/vayo-quantity-stepper.component';
import { ReviewService } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES } from '../../../../core/constants/roles';
import { ApiReview, CreateReviewPayload } from '../../../../core/models/api.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent,
            VayoPriceComponent, VayoStockIndicatorComponent, VayoQuantityStepperComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly behavior = inject(BehaviorService);
  private readonly reviewService = inject(ReviewService);
  private readonly auth = inject(AuthService);
  private qs = inject(QuotationService);
  ivaPercent = this.qs.ivaPercent;

  activeTab: ProductTab = 'specs';
  quantity = signal(1);
  currentProductId = '';
  showAddToCartFeedback = signal(false);
  feedbackMessage = signal('');

  product = signal<ProductDetailData | null>(null);
  relatedProducts = signal<RelatedProduct[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  /** Índice de la imagen actualmente seleccionada en la galería. */
  activeImageIndex = signal(0);

  /** URL de la imagen activa (la grande del hero). */
  activeImageUrl = computed(() => {
    const p = this.product();
    if (!p) return undefined;
    const imgs = p.images && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []);
    return imgs[this.activeImageIndex()] ?? imgs[0];
  });

  /** Lista de URLs disponibles (puede tener entre 0 y 4). */
  galleryImages = computed(() => {
    const p = this.product();
    if (!p) return [];
    return p.images && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []);
  });

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  // Computed signals para precios
  unitPrice = computed(() => {
    const currentProduct = this.product();
    if (!currentProduct?.price || currentProduct.price === 'Consultar') {
      return 0;
    }
    return Number(currentProduct.price.replace(/[^\d]/g, '')) || 0;
  });

  subtotal = computed(() => this.unitPrice() * this.quantity());
  iva = computed(() => Math.round(this.subtotal() * this.ivaPercent() / 100));
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

  // Reseñas reales (cargadas desde el backend)
  reviews = signal<ProductReview[]>([]);
  reviewsLoading = signal(false);

  // Formulario de nueva reseña (solo CLIENTE autenticado)
  showReviewForm = signal(false);
  reviewSending = signal(false);
  reviewMessage = signal('');
  reviewError = signal('');
  newReview = { rating: 5, body: '' };

  /** Proveedores del producto (vienen del propio ProductDetailData). */
  get providers(): ProductProvider[] {
    return this.product()?.suppliers ?? [];
  }

  /** Solo un CLIENTE logueado puede dejar reseña. */
  canReview = computed(() => this.auth.hasRole(ROLES.CLIENTE));

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
      this.loadReviews(id);
    });
  }

  // ── Reseñas ─────────────────────────────────────────────────────────────────

  private loadReviews(productId: string): void {
    this.reviewsLoading.set(true);
    this.reviewService.getProductReviews(productId).subscribe({
      next: (res) => {
        const data = res.data;
        this.reviews.set(data.reviews.map(this.toUiReview));
        // Actualizar rating/conteo del producto con datos reales
        const p = this.product();
        if (p) {
          this.product.set({
            ...p,
            rating: data.summary.average,
            reviewCount: data.summary.count,
          });
        }
        this.reviewsLoading.set(false);
      },
      error: () => {
        this.reviews.set([]);
        this.reviewsLoading.set(false);
      },
    });
  }

  /** Convierte una reseña de la API al formato de UI. */
  private toUiReview(r: ApiReview): ProductReview {
    const initials = (r.authorName || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
    const date = r.createdAt
      ? new Date(r.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    return {
      author: r.authorName,
      company: r.authorCompany || undefined,
      date,
      rating: r.rating,
      body: r.body,
      tags: r.tags ?? [],
      verified: r.verified,
      initials,
    };
  }

  toggleReviewForm(): void {
    this.showReviewForm.update((v) => !v);
    this.reviewError.set('');
    this.reviewMessage.set('');
  }

  setReviewRating(rating: number): void {
    this.newReview.rating = rating;
  }

  submitReview(): void {
    const p = this.product();
    if (!p) return;

    if (!this.newReview.body.trim()) {
      this.reviewError.set('Escribe tu comentario.');
      return;
    }

    this.reviewSending.set(true);
    this.reviewError.set('');
    this.reviewMessage.set('');

    const payload: CreateReviewPayload = {
      rating: this.newReview.rating,
      body: this.newReview.body.trim(),
    };

    this.reviewService.createReview(p.id, payload).subscribe({
      next: (res) => {
        this.reviewSending.set(false);
        this.reviewMessage.set(res.data.message);
        this.newReview = { rating: 5, body: '' };
        this.showReviewForm.set(false);
      },
      error: (err) => {
        this.reviewSending.set(false);
        this.reviewError.set(err?.error?.error ?? 'No se pudo enviar la reseña.');
      },
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

  stockBadgeClass(shortStatus: string): string {
    if (shortStatus === 'En stock')    return 'badge badge--ok';
    if (shortStatus === 'A pedido')    return 'badge badge--warn';
    if (shortStatus === 'Sin stock')   return 'badge badge--danger';
    return 'badge badge--soft';
  }

  private loadProduct(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.product.set(null);
    this.activeImageIndex.set(0); // reset al cambiar de producto

    this.catalogService.getProductById(id).subscribe({
      next: (response) => {
        const detail = mapApiProductDetailToProductDetailData(response.data);
        this.product.set(detail);
        // F3-1: alimentar el motor de recomendaciones con la vista de ficha.
        this.behavior.trackProductView(detail);
        // F3-3: relacionados por categoría/tags del producto ya cargado.
        this.loadRelatedProducts(detail);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No fue posible cargar el detalle del producto.');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * F3-3: relacionados coherentes — primero misma categoría, luego por
   * solapamiento de tags. Si no hay coincidencias, completa con otros productos
   * para no dejar la sección vacía.
   */
  private loadRelatedProducts(current: ProductDetailData): void {
    this.catalogService.getProducts().subscribe({
      next: (response) => {
        const currentTags = new Set(current.tags ?? []);

        const scored = response.data
          .filter((item) => item.id !== current.id)
          .map((item) => {
            const card = mapApiProductToCardData(item);
            const sameCategory = card.categorySlug === current.categorySlug;
            const tagOverlap = (card.tags ?? []).filter((t) => currentTags.has(t)).length;
            // Misma categoría pesa fuerte; cada tag compartido suma.
            const score = (sameCategory ? 10 : 0) + tagOverlap;
            return { item, card, score };
          })
          .sort((a, b) => b.score - a.score);

        // Preferimos los que tienen alguna relación real; si no hay, igual
        // mostramos los primeros para no dejar hueco.
        const related = (scored.some((s) => s.score > 0)
          ? scored.filter((s) => s.score > 0)
          : scored
        )
          .slice(0, 4)
          .map((s) => mapApiProductToRelatedProduct(s.item));

        this.relatedProducts.set(related);
      },
      error: () => {
        this.relatedProducts.set([]);
      },
    });
  }
}
