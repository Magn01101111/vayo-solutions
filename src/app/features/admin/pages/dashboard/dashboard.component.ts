import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { forkJoin }     from 'rxjs';

import { AuthService }   from '../../../../core/services/auth.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ClientService }  from '../../../../core/services/client.service';

interface DashboardMetric {
  label: string;
  value: string | number;
  description: string;
  route: string;
  accent: 'brand' | 'success' | 'warning';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly auth    = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  private readonly clients = inject(ClientService);

  readonly user = this.auth.currentUser;

  metrics: DashboardMetric[] = [];
  loading = true;

  ngOnInit(): void {
    forkJoin({
      products:   this.catalog.getProducts(),
      categories: this.catalog.getCategories(),
      clients:    this.clients.getClients(),
    }).subscribe({
      next: ({ products, categories, clients }) => {
        const totalProducts   = products.data?.length   ?? 0;
        const totalCategories = categories.data?.length ?? 0;
        const totalClients    = clients.data?.length    ?? 0;
        const inStockProducts = products.data?.reduce(
          (sum, p) => sum + (p.availabilityStatus === 'in_stock' ? p.stock : 0),
          0,
        ) ?? 0;

        this.metrics = [
          {
            label: 'Productos activos',
            value: totalProducts,
            description: `${inStockProducts} en stock`,
            route: '/admin/productos',
            accent: 'brand',
          },
          {
            label: 'Categorías',
            value: totalCategories,
            description: 'Categorías activas',
            route: '/admin/categorias',
            accent: 'brand',
          },
          {
            label: 'Clientes',
            value: totalClients,
            description: 'Clientes activos',
            route: '/admin/clientes',
            accent: 'success',
          },
        ];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
