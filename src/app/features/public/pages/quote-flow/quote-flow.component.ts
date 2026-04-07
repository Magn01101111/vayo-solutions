import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CatalogService } from '../../../../core/services/catalog.service';
import { mapApiProductToCardData } from '../../mapper';

import {
  ProductCardData,
  StepFlowItem,
} from '../../../../core/models/ui.models';

import { QuotationService } from '../../../../core/services/quotation.service';
import { StepClientComponent } from './components/step-client/step-client.component';
import { StepDocumentComponent } from './components/step-document/step-document.component';
import { StepConfirmationComponent } from './components/step-confirmation/step-confirmation.component';
@Component({
  selector: 'app-quote-flow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StepClientComponent,
    StepDocumentComponent,
    StepConfirmationComponent,
  ],
  templateUrl: './quote-flow.component.html',
  styleUrl: './quote-flow.component.scss',
})
export class QuoteFlowComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  qs = inject(QuotationService);

  steps: StepFlowItem[] = [
    { step: 1, label: 'Productos' },
    { step: 2, label: 'Cliente' },
    { step: 3, label: 'Vista previa' },
    { step: 4, label: 'Confirmación' },
  ];
  products = signal<ProductCardData[]>([]);
  search = signal('');

  ngOnInit(): void {
    const items = this.qs.items();
    this.products = signal(items);
    console.log('Items en cotización:', items);
  }


  goToStep(step: number) {
    this.qs.setStep(step);
  }
}
