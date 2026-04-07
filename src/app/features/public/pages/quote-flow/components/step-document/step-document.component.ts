import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationService } from '../../../../../../core/services/quotation.service';

@Component({
  selector: 'app-step-document',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-document.component.html',
  styleUrl: './step-document.component.scss',
})
export class StepDocumentComponent {
  readonly qs = inject(QuotationService);

  today = new Date();

  formatCurrency(value: number): string {
    return `$${value.toLocaleString('es-CL')}`;
  }

  getItemTotal(item: any): number {
    return this.qs['parsePrice'](item.price) * item.qty;
  }

  confirm() {
    console.log('Payload listo:', this.qs.buildPayload());
    this.qs.nextStep(); // 👉 pasa a Step 4 (donde se hace el POST real)
  }

  back() {
    this.qs.prevStep();
  }
}
