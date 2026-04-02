import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationService } from '../../../../../../core/services/quotation.service';

@Component({
  selector: 'app-step-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-preview.component.html',
  styleUrl: './step-preview.component.scss',
})
export class StepPreviewComponent {

  readonly qs = inject(QuotationService);

  formatCurrency(value: number): string {
    return `$${value.toLocaleString('es-CL')}`;
  }

  confirm() {
    // más adelante aquí irá el POST
    console.log('Payload listo:', this.qs.buildPayload());

    this.qs.nextStep();
  }

  back() {
    this.qs.prevStep();
  }
}
