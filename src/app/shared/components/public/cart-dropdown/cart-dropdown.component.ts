// cart-dropdown.component.ts
import { Component, computed, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuotationService } from '../../../../core/services/quotation.service';

@Component({
  selector: 'app-cart-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-dropdown.component.html',
  styleUrls: ['./cart-dropdown.component.scss'],
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
