import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuotationService } from '../../../../core/services/quotation.service';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
})

export class PublicHeaderComponent {
  qs = inject(QuotationService);
}
