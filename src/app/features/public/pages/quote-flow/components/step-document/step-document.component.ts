import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotationService } from '../../../../../../core/services/quotation.service';
import {
  PaymentTerms,
  DeliveryTerms,
  QuotationCurrency,
  QuotationItem,
} from '../../../../../../core/models/app.models';

interface PaymentOption { value: PaymentTerms; label: string; }
interface DeliveryOption { value: DeliveryTerms; label: string; }
interface CurrencyOption { value: QuotationCurrency; label: string; symbol: string; }

@Component({
  selector: 'app-step-document',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-document.component.html',
  styleUrl: './step-document.component.scss',
})
export class StepDocumentComponent {
  readonly qs = inject(QuotationService);

  today = new Date();
  printing = signal(false);

  paymentOptions: PaymentOption[] = [
    { value: 'contado', label: 'Contado' },
    { value: '15-dias', label: '15 días' },
    { value: '30-dias', label: '30 días' },
    { value: '60-dias', label: '60 días' },
    { value: '90-dias', label: '90 dias' },
  ];

  deliveryOptions: DeliveryOption[] = [
    { value: 'pickup', label: 'Retiro en tienda' },
    { value: 'delivery', label: 'Despacho local' },
    { value: 'shipping', label: 'Envío nacional' },
  ];

  currencyOptions: CurrencyOption[] = [
    { value: 'CLP', label: 'Pesos chilenos', symbol: '$' },
    { value: 'USD', label: 'Dólares', symbol: 'US$' },
    { value: 'UF', label: 'Unidad de fomento', symbol: 'UF' },
  ];

  validityOptions = [7, 15, 30, 60, 90];

  folio = computed(() => {
    const ts = Date.now().toString().slice(-6);
    return `VYS-${new Date().getFullYear()}-${ts}`;
  });

  validUntil = computed(() => new Date(this.qs.validUntilDate()));

  formatCurrency(value: number): string {
    const c = this.qs.currency();
    if (c === 'CLP') {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(value);
    }
    if (c === 'USD') {
      // Aproximación visual; sin tasa real.
      return `US$ ${(value / 950).toFixed(2)}`;
    }
    return `UF ${(value / 38000).toFixed(2)}`;
  }

  itemTotal(item: QuotationItem): number {
    return this.qs.itemUnitPrice(item) * item.qty;
  }

  deliveryLabel(): string {
    const map: Record<DeliveryTerms, string> = {
      pickup: 'Retiro en tienda',
      delivery: 'Despacho local',
      shipping: 'Envio nacional',
    };
    return map[this.qs.deliveryTerms()];
  }

  paymentLabel(): string {
    const map: Record<PaymentTerms, string> = {
      contado: 'Contado',
      '15-dias': '15 dias',
      '30-dias': '30 dias',
      '60-dias': '60 dias',
      '90-dias': '90 dias',
    };
    return map[this.qs.paymentTerms()];
  }

  setValidity(days: number) { this.qs.setValidityDays(days); }
  setPayment(t: PaymentTerms) { this.qs.setPaymentTerms(t); }
  setCurrency(c: QuotationCurrency) { this.qs.setCurrency(c); }
  setNotes(n: string) { this.qs.setGeneralNotes(n); }

  print() {
    this.printing.set(true);
    setTimeout(() => {
      window.print();
      this.printing.set(false);
    }, 50);
  }

  confirm() {
    this.qs.nextStep();
  }

  back() {
    this.qs.prevStep();
  }
}
