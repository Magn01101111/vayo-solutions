import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationService } from '../../../../../../core/services/quotation.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-step-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-confirmation.component.html',
  styleUrl: './step-confirmation.component.scss',
})
export class StepConfirmationComponent {

  private router = inject(Router);
  private qs = inject(QuotationService);

  finish() {
    this.qs.clearCart();
    this.router.navigate(['/catalogo']);
  }
}
