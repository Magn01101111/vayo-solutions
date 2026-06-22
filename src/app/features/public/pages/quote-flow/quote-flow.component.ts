import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CatalogService } from '../../../../core/services/catalog.service';
import { mapApiProductToCardData } from '../../mapper';

import {
  ProductCardData,
  StepFlowItem,
} from '../../../../core/models/ui.models';

import { QuotationService } from '../../../../core/services/quotation.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CouponService } from '../../../../core/services/coupon.service';
import { MyCoupon } from '../../../../core/models/app.models';
import { StepClientComponent } from './components/step-client/step-client.component';
import { StepDocumentComponent } from './components/step-document/step-document.component';
import { StepConfirmationComponent } from './components/step-confirmation/step-confirmation.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-quote-flow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    StepClientComponent,
    StepDocumentComponent,
    StepConfirmationComponent,
    IconComponent,
  ],
  templateUrl: './quote-flow.component.html',
  styleUrl: './quote-flow.component.scss',
})
export class QuoteFlowComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly confirm = inject(ConfirmService);
  private readonly authSvc = inject(AuthService);
  private readonly couponSvc = inject(CouponService);
  qs = inject(QuotationService);

  steps: StepFlowItem[] = [
    { step: 1, label: 'Productos' },
    { step: 2, label: 'Cliente' },
    { step: 3, label: 'Vista previa' },
    { step: 4, label: 'Confirmación' },
  ];

  search = signal('');
  expandedNotesId = signal<string | null>(null);
  showCouponInput = signal(false);
  couponCode = signal('');
  myCoupons = signal<MyCoupon[]>([]);

  filteredItems = computed(() => {
    const term = this.search().trim().toLowerCase();
    const items = this.qs.items();
    if (!term) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        i.sku.toLowerCase().includes(term) ||
        (i.category ?? '').toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    if (this.authSvc.currentUser) {
      this.couponSvc.getMyCoupons().subscribe({
        next: (res) => { if (res.ok && res.data) this.myCoupons.set(res.data); },
        error: () => { /* silencioso */ },
      });
    }
  }

  usarCuponSugerido(code: string): void {
    this.qs.applyCoupon(code);
  }

  couponValueLabel(c: MyCoupon): string {
    if (c.type === 'percentage') return `−${c.value}%`;
    return `−${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(c.value)}`;
  }

  goToStep(step: number) {
    this.qs.setStep(step);
  }

  onQtyInput(id: string, value: string) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    this.qs.setQty(id, parsed);
  }

  onItemNotesInput(id: string, value: string) {
    this.qs.setItemNotes(id, value);
  }

  toggleItemNotes(id: string) {
    this.expandedNotesId.set(this.expandedNotesId() === id ? null : id);
  }

  itemSubtotal(price: string, qty: number): number {
    return this.qs.parsePrice(price) * qty;
  }

  formatCLP(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
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

  applyCoupon() {
    const ok = this.qs.applyCoupon(this.couponCode());
    if (ok) {
      this.couponCode.set('');
      this.showCouponInput.set(false);
    }
  }

  removeCoupon() {
    this.qs.removeCoupon();
  }

  selectShipping(id: string) {
    this.qs.setShippingMethod(id);
  }

  goToCatalog() {
    window.location.href = '/catalogo';
  }

  async clearCart() {
    const ok = await this.confirm.ask({
      title: 'Vaciar carrito',
      message: 'Se quitarán todos los productos de tu cotización en curso.',
      confirmLabel: 'Vaciar',
      tone: 'danger',
    });
    if (ok) this.qs.clearCart();
  }
}
