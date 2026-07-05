import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { QuotationApiService, ApiQuote } from '../../../../core/services/quotation-api.service';
import { SaleService, ApiSale } from '../../../../core/services/sale.service';
import { QuotationService } from '../../../../core/services/quotation.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { FavoriteService } from '../../../../core/services/favorite.service';
import { CouponService } from '../../../../core/services/coupon.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { ProductCardData } from '../../../../core/models/ui.models';
import { MyCoupon } from '../../../../core/models/app.models';
import { mapApiProductToCardData } from '../../mapper';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

type PortalTab = 'resumen' | 'cotizaciones' | 'compras' | 'favoritos' | 'cupones' | 'datos';

@Component({
  selector: 'app-client-portal',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './client-portal.component.html',
  styleUrl: './client-portal.component.scss',
})
export class ClientPortalComponent implements OnInit {
  private authService = inject(AuthService);
  private quoteApi = inject(QuotationApiService);
  private saleService = inject(SaleService);
  private quoteSvc = inject(QuotationService);
  private catalogService = inject(CatalogService);
  private favSvc = inject(FavoriteService);
  private couponSvc = inject(CouponService);
  private paymentSvc = inject(PaymentService);
  private router = inject(Router);

  // Getter reactivo: siempre muestra el valor más reciente tras una actualización de perfil
  get currentUser() { return this.authService.currentUser; }
  activeTab = signal<PortalTab>('resumen');

  loading = signal(false);
  error = signal<string | null>(null);

  totalQuotes = signal(0);
  totalSales = signal(0);
  lastSale = signal<{ folio: string; total: number; createdAt: string } | null>(null);

  quotes = signal<ApiQuote[]>([]);
  sales = signal<ApiSale[]>([]);

  selectedQuote = signal<ApiQuote | null>(null);
  selectedSale = signal<ApiSale | null>(null);

  actionMsg = signal<string | null>(null);
  actionError = signal<string | null>(null);
  payingSaleId = signal<string | null>(null);

  // ── Cupones ────────────────────────────────────────────────────────────────
  coupons = signal<MyCoupon[]>([]);
  couponsLoading = signal(false);
  couponsError = signal<string | null>(null);

  // ── Favoritos ──────────────────────────────────────────────────────────────
  private allProducts = signal<ProductCardData[]>([]);
  favoritesLoading = signal(false);
  /** Productos favoritos = catálogo activo filtrado por los ids del servicio. */
  favoriteProducts = computed(() =>
    this.allProducts().filter((p) => this.favSvc.favoriteIds().has(p.id)),
  );

  ngOnInit(): void {
    this.loadSummary();
    this.loadFavorites();
    this.loadCoupons();
  }

  private loadSummary(): void {
    this.loading.set(true);
    this.error.set(null);

    this.quoteApi.getQuotes().subscribe({
      next: (res) => {
        if (res.ok) {
          this.totalQuotes.set(res.data?.length ?? 0);
          this.quotes.set(res.data ?? []);
        }
      },
      error: () => this.error.set('Error al cargar cotizaciones'),
    });

    this.saleService.getSales().subscribe({
      next: (res) => {
        if (res.ok && res.data) {
          const list = res.data;
          this.totalSales.set(list.length);
          this.sales.set(list);
          if (list.length > 0) {
            this.lastSale.set({
              folio: list[0].folio,
              total: list[0].totals?.total ?? 0,
              createdAt: list[0].createdAt ?? '',
            });
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar compras');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: PortalTab): void {
    this.activeTab.set(tab);
  }

  formatCLP(value: number | undefined): string {
    if (value == null) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  statusLabel(status: string | undefined): string {
    if (!status) return '—';
    const map: Record<string, string> = {
      sent: 'Enviada', accepted: 'Aceptada', rejected: 'Rechazada', expired: 'Vencida',
      draft: 'Borrador', pending: 'Pendiente', paid: 'Pagada', cancelled: 'Anulada',
    };
    return map[status] || status;
  }

  statusClass(status: string | undefined): string {
    if (status === 'accepted' || status === 'paid') return 'badge badge-success';
    if (status === 'rejected' || status === 'cancelled' || status === 'expired') return 'badge badge-danger';
    if (status === 'sent' || status === 'pending') return 'badge badge-warning';
    return 'badge';
  }

  openQuoteDetail(quote: ApiQuote): void {
    this.selectedQuote.set(quote);
    // Notificar al cotizador la primera vez que el cliente abre la cotización
    if (!quote.viewedAt) {
      this.quoteApi.markViewed(quote._id).subscribe({
        next: (res) => {
          if (res.ok && res.data?.viewedAt) {
            // Actualizar la lista local para no re-enviar la notificación
            this.quotes.update((list) =>
              list.map((q) => q._id === quote._id ? { ...q, viewedAt: res.data!.viewedAt } : q),
            );
          }
        },
        error: () => { /* silencioso — no rompe el flujo del usuario */ },
      });
    }
  }

  closeQuoteDetail(): void {
    this.selectedQuote.set(null);
  }

  openSaleDetail(sale: ApiSale): void {
    this.selectedSale.set(sale);
  }

  closeSaleDetail(): void {
    this.selectedSale.set(null);
  }

  private loadCoupons(): void {
    this.couponsLoading.set(true);
    this.couponSvc.getMyCoupons().subscribe({
      next: (res) => {
        if (res.ok && res.data) {
          this.coupons.set(res.data);
        }
        this.couponsLoading.set(false);
      },
      error: () => {
        this.couponsError.set('Error al cargar cupones');
        this.couponsLoading.set(false);
      },
    });
  }

  couponStatus(c: MyCoupon): 'vigente' | 'por-vencer' | 'usado' | 'expirado' {
    const now = new Date();
    if (c.validUntil && new Date(c.validUntil) < now) return 'expirado';
    if (c.validUntil) {
      const diff = (new Date(c.validUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 3) return 'por-vencer';
    }
    return 'vigente';
  }

  couponStatusLabel(c: MyCoupon): string {
    const s = this.couponStatus(c);
    if (s === 'vigente') return 'Vigente';
    if (s === 'por-vencer') return 'Por vencer';
    if (s === 'usado') return 'Usado';
    return 'Expirado';
  }

  couponStatusClass(c: MyCoupon): string {
    const s = this.couponStatus(c);
    if (s === 'vigente') return 'badge badge-success';
    if (s === 'por-vencer') return 'badge badge-warning';
    return 'badge badge-danger';
  }

  couponValueLabel(c: MyCoupon): string {
    if (c.type === 'percentage') return `${c.value}% dto.`;
    return this.formatCLP(c.value) + ' dto.';
  }

  usarCupon(c: MyCoupon): void {
    this.quoteSvc.applyCoupon(c.code);
    this.router.navigate(['/cotizacion']);
  }

  private loadFavorites(): void {
    this.favSvc.loadFavorites();
    this.favoritesLoading.set(true);
    this.catalogService.getProducts().subscribe({
      next: (res) => {
        if (res.ok && res.data) {
          this.allProducts.set(res.data.map((p) => mapApiProductToCardData(p)));
        }
        this.favoritesLoading.set(false);
      },
      error: () => this.favoritesLoading.set(false),
    });
  }

  removeFavorite(productId: string): void {
    this.favSvc.toggle(productId);
  }

  // ── Edición de perfil ───────────────────────────────────────────────────────
  profileEditing = signal(false);
  profileName = signal('');
  profilePhone = signal('');
  profileSaving = signal(false);
  profileError = signal<string | null>(null);
  profileSuccess = signal<string | null>(null);
  photoUploading = signal(false);

  startEditProfile(): void {
    this.profileName.set(this.currentUser?.name ?? '');
    this.profilePhone.set(this.currentUser?.phone ?? '');
    this.profileError.set(null);
    this.profileSuccess.set(null);
    this.profileEditing.set(true);
  }

  cancelEditProfile(): void {
    this.profileEditing.set(false);
  }

  saveProfile(): void {
    const name = this.profileName().trim();
    if (!name) {
      this.profileError.set('El nombre no puede estar vacío.');
      return;
    }
    this.profileSaving.set(true);
    this.profileError.set(null);
    this.authService.updateProfile({ name, phone: this.profilePhone().trim() }).subscribe({
      next: (res) => {
        this.profileSaving.set(false);
        if (res.ok) {
          this.profileEditing.set(false);
          this.profileSuccess.set('Perfil actualizado correctamente.');
          setTimeout(() => this.profileSuccess.set(null), 3000);
        } else {
          this.profileError.set((res as any).error ?? 'Error al guardar.');
        }
      },
      error: () => {
        this.profileSaving.set(false);
        this.profileError.set('Error de conexión. Intenta de nuevo.');
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.profileError.set('La imagen no puede superar 2 MB.');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.profileError.set('Formato no permitido. Usa JPG, PNG o WEBP.');
      return;
    }
    this.photoUploading.set(true);
    this.profileError.set(null);
    this.authService.uploadProfilePhoto(file).subscribe({
      next: (res) => {
        this.photoUploading.set(false);
        if (res.ok) {
          this.profileSuccess.set('Foto actualizada.');
          setTimeout(() => this.profileSuccess.set(null), 3000);
        } else {
          this.profileError.set((res as any).error ?? 'Error al subir la foto.');
        }
      },
      error: () => {
        this.photoUploading.set(false);
        this.profileError.set('Error al subir la foto. Intenta de nuevo.');
      },
    });
    input.value = '';
  }

  paymentLabel(method: string | undefined): string {
    if (!method) return '';
    const map: Record<string, string> = {
      cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta',
      credit: 'Crédito', other: 'Otro',
    };
    return map[method] || method;
  }

  downloadPDF(quoteId: string): void {
    this.quoteApi.downloadPDF(quoteId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cotizacion.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.error.set('Error al descargar PDF'),
    });
  }

  repeatQuote(quote: ApiQuote): void {
    if (!quote.items || quote.items.length === 0) return;
    this.quoteSvc.repeatFromQuote(quote.items);
    this.router.navigate(['/cotizacion']);
  }

  acceptQuote(quote: ApiQuote): void {
    this.actionMsg.set(null);
    this.actionError.set(null);
    this.quoteApi.updateStatus(quote._id, 'accepted').subscribe({
      next: () => {
        this.actionMsg.set(`Cotización ${quote.folio} aceptada`);
        this.loadSummary();
      },
      error: () => this.actionError.set('Error al aceptar cotización'),
    });
  }

  rejectQuote(quote: ApiQuote): void {
    this.actionMsg.set(null);
    this.actionError.set(null);
    this.quoteApi.updateStatus(quote._id, 'rejected').subscribe({
      next: () => {
        this.actionMsg.set(`Cotización ${quote.folio} rechazada`);
        this.loadSummary();
      },
      error: () => this.actionError.set('Error al rechazar cotización'),
    });
  }

  saleForQuote(quote: ApiQuote): ApiSale | null {
    return this.sales().find((sale) => String(sale.quoteId ?? '') === String(quote._id)) ?? null;
  }

  payQuote(quote: ApiQuote): void {
    const sale = this.saleForQuote(quote);
    if (!sale) {
      this.actionError.set('El pago aun no esta habilitado. El cotizador debe aceptar y crear la venta.');
      return;
    }
    this.paySale(sale);
  }

  paySale(sale: ApiSale): void {
    if (!sale.id || sale.status !== 'pending' || this.payingSaleId()) return;
    this.actionMsg.set(null);
    this.actionError.set(null);
    this.payingSaleId.set(sale.id);

    this.paymentSvc.initWebpay(sale.id).subscribe({
      next: (res) => {
        const { url, token } = res.data;
        this.paymentSvc.redirectToWebpay(url, token);
      },
      error: (err) => {
        this.payingSaleId.set(null);
        this.actionError.set(err?.error?.error ?? 'No se pudo iniciar el pago con Webpay.');
      },
    });
  }
}
