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
import { StepPreviewComponent } from './components/step-preview/step-preview.component';
import { StepConfirmationComponent } from './components/step-confirmation/step-confirmation.component';
@Component({
  selector: 'app-quote-flow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StepClientComponent,
    StepPreviewComponent,
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
    this.loadProducts();
  }

  private loadProducts() {
    this.catalogService.getProducts().subscribe({
      next: (res) => {
        const mapped = res.data.map((p) => mapApiProductToCardData(p));
        this.products.set(mapped);
      },
    });
  }

  // 🔹 filtro
  filteredProducts = computed(() => {
    const term = this.search().toLowerCase();

    return this.products().filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term),
    );
  });

  // 🔹 utils (igual que ProductDetail)
  parsePrice(price: string): number {
    if (!price || price === 'Consultar') return 0;
    return Number(price.replace(/[^\d]/g, '')) || 0;
  }

  goToStep(step: number) {
    this.qs.setStep(step);
  }
}
