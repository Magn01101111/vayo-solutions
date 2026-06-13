import {
  Component,
  computed,
  inject,
  HostListener,
  ElementRef,
  signal,
  effect,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { QuotationService } from '../../../../core/services/quotation.service';
import { IconComponent }    from '../../icon/icon.component';

@Component({
  selector: 'app-cart-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, IconComponent],
  templateUrl: './cart-dropdown.component.html',
  styleUrls: ['./cart-dropdown.component.scss'],
})
export class CartDropdownComponent {
  private qs = inject(QuotationService);
  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  isOpen = false;
  bumping = signal(false);
  showCoupon = signal(false);
  couponCode = signal('');
  expandedItem = signal<string | null>(null);
  now = signal(Date.now());

  items = this.qs.items;
  savedItems = this.qs.savedItems;
  totalItems = this.qs.totalItems;
  uniqueItems = this.qs.uniqueItems;
  subtotal = this.qs.subtotal;
  discount = this.qs.discount;
  iva = this.qs.iva;
  ivaPercent = this.qs.ivaPercent;
  shippingCost = this.qs.shippingCost;
  total = this.qs.total;
  coupon = this.qs.coupon;
  couponError = this.qs.couponError;
  lastRemoved = this.qs.lastRemoved;
  reservationExpiresAt = this.qs.reservationExpiresAt;
  hasItems = computed(() => this.totalItems() > 0);
  hasSaved = computed(() => this.savedItems().length > 0);

  remainingMs = computed(() => {
    const ex = this.reservationExpiresAt();
    if (!ex) return 0;
    return Math.max(0, new Date(ex).getTime() - this.now());
  });

  remainingLabel = computed(() => {
    const ms = this.remainingMs();
    if (!ms) return '';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  });

  constructor() {
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    let prevTotal = this.totalItems();
    effect(() => {
      const t = this.totalItems();
      if (isBrowser && t > prevTotal) {
        this.bumping.set(true);
        setTimeout(() => this.bumping.set(false), 350);
      }
      prevTotal = t;
    });

    if (isBrowser) {
      interval(1000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.now.set(Date.now()));
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
    this.expandedItem.set(null);
  }

  toggleNotes(id: string) {
    this.expandedItem.set(this.expandedItem() === id ? null : id);
  }

  onQtyInput(id: string, value: string) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    this.qs.setQty(id, parsed);
  }

  onNotesInput(id: string, value: string) {
    this.qs.setItemNotes(id, value);
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
  saveForLater(id: string) {
    this.qs.saveForLater(id);
  }
  moveToCart(id: string) {
    this.qs.moveToCart(id);
  }
  removeSavedItem(id: string) {
    this.qs.removeSavedItem(id);
  }
  undoRemove() {
    this.qs.undoRemove();
  }
  dismissUndo() {
    this.qs.dismissUndo();
  }

  applyCoupon() {
    const ok = this.qs.applyCoupon(this.couponCode());
    if (ok) {
      this.couponCode.set('');
      this.showCoupon.set(false);
    }
  }

  removeCoupon() {
    this.qs.removeCoupon();
  }

  clearCart() {
    if (confirm('¿Deseas vaciar todo el carrito?')) {
      this.qs.clearCart();
    }
  }

  parsePrice(price: string): number {
    return this.qs.parsePrice(price);
  }

  itemSubtotal(price: string, qty: number): number {
    return this.qs.parsePrice(price) * qty;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.closeDropdown();
  }
}
