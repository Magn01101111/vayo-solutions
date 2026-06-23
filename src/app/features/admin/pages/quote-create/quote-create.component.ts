import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CatalogService } from '../../../../core/services/catalog.service';
import { ClientService } from '../../../../core/services/client.service';
import { QuotationApiService } from '../../../../core/services/quotation-api.service';
import { ActionFeedbackService } from '../../../../core/services/action-feedback.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ApiClient, ApiProductListItem } from '../../../../core/models/api.models';

interface QuoteLine {
  product: ApiProductListItem;
  qty: number;
}

/**
 * Creación asistida de cotización (COTIZADOR/ADMIN).
 * Hace explícita la dinámica: el cotizador elige un cliente (por RUT/nombre) o
 * crea uno nuevo, arma los productos, y la cotización queda asignada a ese
 * cliente y registrada a su nombre como autor (venta asistida).
 */
@Component({
  selector: 'app-quote-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './quote-create.component.html',
  styleUrl: './quote-create.component.scss',
})
export class QuoteCreateComponent implements OnInit {
  private readonly catalogSvc = inject(CatalogService);
  private readonly clientSvc  = inject(ClientService);
  private readonly quoteSvc   = inject(QuotationApiService);
  private readonly feedback   = inject(ActionFeedbackService);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);

  // ── Cliente ─────────────────────────────────────────────────────────────────
  clientSearch  = signal('');
  clientResults = signal<ApiClient[]>([]);
  searchingClient = signal(false);
  selectedClient = signal<ApiClient | null>(null);

  // Alta rápida de cliente nuevo
  showNewClient = signal(false);
  newClient = { name: '', rut: '', email: '', phone: '', company: '' };
  creatingClient = signal(false);
  clientError = signal('');

  // ── Productos ─────────────────────────────────────────────────────────────
  private allProducts: ApiProductListItem[] = [];
  productSearch = signal('');
  loadingProducts = signal(false);
  lines = signal<QuoteLine[]>([]);

  // ── Extras ──────────────────────────────────────────────────────────────────
  couponCode = signal('');
  generalNotes = signal('');

  submitting = signal(false);
  submitError = signal('');

  ngOnInit(): void {
    this.loadingProducts.set(true);
    this.catalogSvc.getProducts(undefined, undefined, false).subscribe({
      next: (res) => {
        this.allProducts = (res.data ?? []).filter((p) => p.price != null);
        this.loadingProducts.set(false);
      },
      error: () => { this.loadingProducts.set(false); },
    });
  }

  // ── Cliente ─────────────────────────────────────────────────────────────────

  searchClients(): void {
    const q = this.clientSearch().trim();
    if (q.length < 2) { this.clientResults.set([]); return; }
    this.searchingClient.set(true);
    this.clientSvc.getClients({ q, active: 'all' }).subscribe({
      next: (res) => { this.clientResults.set(res.data ?? []); this.searchingClient.set(false); },
      error: () => { this.searchingClient.set(false); },
    });
  }

  selectClient(c: ApiClient): void {
    this.selectedClient.set(c);
    this.clientResults.set([]);
    this.clientSearch.set('');
    this.showNewClient.set(false);
  }

  clearClient(): void {
    this.selectedClient.set(null);
  }

  toggleNewClient(): void {
    this.showNewClient.update((v) => !v);
    this.clientError.set('');
  }

  createClient(): void {
    if (!this.newClient.name.trim()) {
      this.clientError.set('El nombre es obligatorio.');
      return;
    }
    this.creatingClient.set(true);
    this.clientError.set('');
    this.clientSvc.createClient({
      name: this.newClient.name.trim(),
      rut: this.newClient.rut.trim() || undefined,
      email: this.newClient.email.trim() || undefined,
      phone: this.newClient.phone.trim() || undefined,
      company: this.newClient.company.trim() || undefined,
    }).subscribe({
      next: (res) => {
        this.creatingClient.set(false);
        this.selectClient(res.data);
        this.newClient = { name: '', rut: '', email: '', phone: '', company: '' };
      },
      error: (err) => {
        this.creatingClient.set(false);
        this.clientError.set(err?.error?.error ?? 'No se pudo crear el cliente.');
      },
    });
  }

  // ── Productos ─────────────────────────────────────────────────────────────

  filteredProducts = computed<ApiProductListItem[]>(() => {
    const q = this.productSearch().trim().toLowerCase();
    if (!q) return [];
    return this.allProducts
      .filter((p) => `${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(q))
      .slice(0, 8);
  });

  /** Precio unitario vigente (oferta si aplica, si no el normal). */
  unitPrice(p: ApiProductListItem): number {
    const now = Date.now();
    const onOffer =
      p.offerPrice != null && p.offerPrice > 0 &&
      p.price != null && p.offerPrice < p.price &&
      (!p.offerStartsAt || new Date(p.offerStartsAt).getTime() <= now) &&
      (!p.offerEndsAt || new Date(p.offerEndsAt).getTime() >= now);
    return onOffer ? p.offerPrice! : (p.price ?? 0);
  }

  addProduct(p: ApiProductListItem): void {
    const lines = [...this.lines()];
    const existing = lines.find((l) => l.product.id === p.id);
    if (existing) {
      existing.qty += 1;
    } else {
      lines.push({ product: p, qty: 1 });
    }
    this.lines.set(lines);
    this.productSearch.set('');
  }

  setLineQty(id: string, qty: number): void {
    const n = Math.max(1, Math.floor(qty) || 1);
    this.lines.set(this.lines().map((l) => (l.product.id === id ? { ...l, qty: n } : l)));
  }

  removeLine(id: string): void {
    this.lines.set(this.lines().filter((l) => l.product.id !== id));
  }

  lineTotal(l: QuoteLine): number {
    return this.unitPrice(l.product) * l.qty;
  }

  subtotal = computed(() => this.lines().reduce((acc, l) => acc + this.unitPrice(l.product) * l.qty, 0));

  formatCLP(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  /** Listo para generar: cliente elegido y al menos un producto. */
  canSubmit = computed(() => !!this.selectedClient() && this.lines().length > 0);

  // ── Generar cotización ──────────────────────────────────────────────────────

  submit(): void {
    const client = this.selectedClient();
    if (!client || this.lines().length === 0) return;

    const items = this.lines().map((l) => ({
      productId: l.product.id,
      name: l.product.name,
      sku: l.product.sku,
      price: this.unitPrice(l.product),
      quantity: l.qty,
      total: this.unitPrice(l.product) * l.qty,
    }));

    const sub = this.subtotal();
    const payload = {
      items,
      client: {
        name: client.name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        company: client.company ?? '',
        notes: '',
      },
      extra: {
        customerType: client.company ? 'company' : 'person',
        taxId: client.rut ?? '',
        assignClientId: client.id,
        billingAddress: { street: client.address ?? '' },
        generalNotes: this.generalNotes().trim(),
        validityDays: 30,
        coupon: this.couponCode().trim() ? { code: this.couponCode().trim() } : undefined,
      },
      totals: { subtotal: sub, iva: 0, total: sub },
      metadata: { status: 'sent' },
    };

    this.feedback.run({
      confirm: {
        title: 'Generar cotización',
        message: `Se creará una cotización para ${client.name} con ${items.length} producto(s).`,
        confirmLabel: 'Generar cotización',
        tone: 'primary',
      },
      action: () => this.quoteSvc.createQuote(payload).toPromise().then((res) => res!),
      outcome: (res: any) => ({
        title: `¡Cotización ${res?.data?.folio ?? ''} creada!`,
        message: `Quedó asignada a ${client.name} y registrada a tu nombre como cotizador.`,
        tone: 'success',
        actions: [
          { label: 'Ir a cotizaciones', route: ['/admin/cotizaciones'], dismiss: true, tone: 'primary' },
          { label: 'Crear otra', dismiss: true, tone: 'ghost' },
        ],
      }),
      onError: (e: any) => ({
        title: 'No se pudo crear la cotización',
        message: e?.error?.error ?? 'Revisa los datos e inténtalo de nuevo.',
        tone: 'danger',
        actions: [{ label: 'Cerrar', dismiss: true }],
      }),
    }).then(() => {
      // Si sigue en la página (eligió "Crear otra"), limpiamos el formulario.
      this.lines.set([]);
      this.couponCode.set('');
      this.generalNotes.set('');
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/cotizaciones']);
  }
}
