// cart-dropdown.component.ts
import { Component, computed, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuotationService } from '../../../../core/services/quotation.service';

@Component({
  selector: 'app-cart-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="cart-dropdown" [class.cart-dropdown--open]="isOpen">
      <button
        class="cart-dropdown__trigger"
        (click)="toggleDropdown()"
        [class.cart-dropdown__trigger--active]="hasItems()"
      >
        <svg class="cart-dropdown__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>

        @if (totalItems() > 0) {
          <span class="cart-dropdown__badge">{{ totalItems() }}</span>
        }
      </button>

      @if (isOpen) {
        <div class="cart-dropdown__panel">
          <div class="cart-dropdown__header">
            <h4 class="cart-dropdown__title">Mi carrito</h4>
            @if (totalItems() > 0) {
              <button class="cart-dropdown__clear" (click)="clearCart()">
                Vaciar
              </button>
            }
          </div>

          @if (totalItems() === 0) {
            <div class="cart-dropdown__empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <p>Tu carrito está vacío</p>
              <a routerLink="/catalogo" class="btn btn-outline btn-sm" (click)="closeDropdown()">
                Explorar productos
              </a>
            </div>
          } @else {
            <div class="cart-dropdown__items">
              @for (item of items(); track item.id) {
                <div class="cart-item">
                  <div class="cart-item__info">
                    <h5 class="cart-item__title">{{ item.name }}</h5>
                    <div class="cart-item__price">
                      {{ formatPrice(parsePrice(item.price) * item.qty) }}
                    </div>
                  </div>

                  <div class="cart-item__controls">
                    <div class="quantity-selector">
                      <button
                        class="quantity-selector__btn"
                        (click)="decreaseQty(item.id)"
                        [disabled]="item.qty === 1"
                      >-</button>
                      <span class="quantity-selector__value">{{ item.qty }}</span>
                      <button
                        class="quantity-selector__btn"
                        (click)="increaseQty(item.id)"
                      >+</button>
                    </div>

                    <button class="cart-item__remove" (click)="removeItem(item.id)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>

            <div class="cart-dropdown__footer">
              <div class="cart-dropdown__summary">
                <div class="summary-line">
                  <span>Subtotal</span>
                  <span>{{ formatPrice(subtotal()) }}</span>
                </div>
                <div class="summary-line summary-line--total">
                  <span>Total</span>
                  <span>{{ formatPrice(total()) }}</span>
                </div>
              </div>

              <div class="cart-dropdown__actions">
                <a routerLink="/cotizacion" class="btn btn-primary btn-block" (click)="closeDropdown()">
                  Ir a cotización
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-dropdown {
      position: relative;
    }

    .cart-dropdown__trigger {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      padding: var(--space-2);
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      transition: all var(--transition-fast);
    }

    .cart-dropdown__trigger:hover {
      background: var(--color-brand-100);
      color: var(--color-brand-900);
    }

    .cart-dropdown__trigger--active {
      color: var(--color-brand-900);
    }

    .cart-dropdown__icon {
      width: 1.25rem;
      height: 1.25rem;
    }

    .cart-dropdown__badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 1.125rem;
      height: 1.125rem;
      padding: 0 0.25rem;
      background: var(--color-danger);
      color: white;
      font-size: 0.6875rem;
      font-weight: 600;
      border-radius: var(--radius-pill);
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .cart-dropdown__panel {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: 22rem;
      max-width: calc(100vw - 2rem);
      background: var(--color-white);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      z-index: 1000;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-0.5rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .cart-dropdown__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4);
      border-bottom: 1px solid var(--color-border-primary);
    }

    .cart-dropdown__title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .cart-dropdown__clear {
      background: transparent;
      border: none;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: color var(--transition-fast);
    }

    .cart-dropdown__clear:hover {
      color: var(--color-danger);
    }

    .cart-dropdown__empty {
      padding: var(--space-8) var(--space-4);
      text-align: center;
    }

    .cart-dropdown__empty svg {
      margin-bottom: var(--space-4);
      color: var(--color-text-muted);
    }

    .cart-dropdown__empty p {
      margin-bottom: var(--space-4);
      font-size: 0.875rem;
    }

    .cart-dropdown__items {
      max-height: 22rem;
      overflow-y: auto;
    }

    .cart-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border-secondary);
    }

    .cart-item:hover {
      background: var(--color-bg-soft);
    }

    .cart-item__info {
      flex: 1;
    }

    .cart-item__title {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 0.25rem;
      line-height: 1.3;
    }

    .cart-item__price {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-brand-900);
    }

    .cart-item__controls {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: var(--color-bg-soft);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--radius-sm);
    }

    .quantity-selector__btn {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .quantity-selector__btn:hover:not(:disabled) {
      background: var(--color-brand-100);
      color: var(--color-brand-900);
    }

    .quantity-selector__btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .quantity-selector__value {
      min-width: 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .cart-item__remove {
      background: transparent;
      border: none;
      padding: 0.25rem;
      color: var(--color-text-muted);
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }

    .cart-item__remove:hover {
      color: var(--color-danger);
      background: var(--color-danger-bg);
    }

    .cart-dropdown__footer {
      padding: var(--space-4);
      border-top: 1px solid var(--color-border-primary);
      background: var(--color-bg-soft);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    }

    .cart-dropdown__summary {
      margin-bottom: var(--space-4);
    }

    .summary-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin-bottom: var(--space-2);
    }

    .summary-line--total {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-top: var(--space-2);
      padding-top: var(--space-2);
      border-top: 1px solid var(--color-border-primary);
    }

    .cart-dropdown__actions {
      display: flex;
      gap: var(--space-2);
    }

    /* Responsive */
    @media (max-width: 576px) {
      .cart-dropdown__panel {
        position: fixed;
        top: auto;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        max-width: 100%;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        animation: slideUp 0.2s ease;
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .cart-dropdown__items {
        max-height: 60vh;
      }
    }
  `]
})
export class CartDropdownComponent {
  private qs = inject(QuotationService);
  private elementRef = inject(ElementRef);

  isOpen = false;

  items = this.qs.items;
  totalItems = this.qs.totalItems;
  subtotal = this.qs.subtotal;
  total = this.qs.total;
  hasItems = computed(() => this.totalItems() > 0);

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  increaseQty(id: string) {
    this.qs.increaseQty(id);
  }

  decreaseQty(id: string) {
    this.qs.decreaseQty(id);
  }

  removeItem(id: string) {
    this.qs.removeItem(id);
  }

  clearCart() {
    if (confirm('¿Deseas vaciar todo el carrito?')) {
      this.qs.clearCart();
    }
  }

  parsePrice(price: string): number {
    if (!price || price === 'Consultar') return 0;
    return Number(price.replace(/[^\d]/g, '')) || 0;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.isOpen = false;
  }
}
