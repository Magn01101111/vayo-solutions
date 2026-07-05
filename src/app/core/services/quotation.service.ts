import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ProductCardData } from '../../core/models/ui.models';
import {
  QuotationItem,
  QuotationClient,
  SavedItem,
  Coupon,
  ShippingMethod,
  QuotationCurrency,
  PaymentTerms,
  DeliveryTerms,
} from '../../core/models/app.models';
import { StorageService } from './storage.service';
import { CompanyService } from './company.service';
import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';

const STORAGE_KEY = 'vayo_quote';

const MAX_QTY_DEFAULT = 999;
const RESERVATION_MINUTES = 15;

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: 'pickup', label: 'Retiro en tienda', description: 'Sin costo, retira en sucursal', cost: 0, estimatedDays: 'Mismo día' },
  { id: 'rm', label: 'Despacho Región Metropolitana', cost: 8990, estimatedDays: '1-2 días hábiles' },
  { id: 'national', label: 'Despacho nacional', cost: 14990, estimatedDays: '3-5 días hábiles' },
  { id: 'express', label: 'Express 24h', cost: 24990, estimatedDays: '24 horas' },
];

function deliveryTermForShipping(id: string): DeliveryTerms {
  if (id === 'pickup') return 'pickup';
  if (id === 'national') return 'shipping';
  return 'delivery';
}

function shippingMethodForDelivery(term: DeliveryTerms, currentId: string): string {
  if (term === 'pickup') return 'pickup';
  if (term === 'shipping') return 'national';
  if (currentId === 'rm' || currentId === 'express') return currentId;
  return 'rm';
}

@Injectable({
  providedIn: 'root',
})
export class QuotationService {
  // ─────────────── STATE ───────────────
  private _items = signal<QuotationItem[]>([]);
  private _savedItems = signal<SavedItem[]>([]);
  private _client = signal<QuotationClient | null>(null);
  private _step = signal<number>(1);
  private _coupon = signal<Coupon | null>(null);
  private _couponError = signal<string | null>(null);
  private _shippingMethodId = signal<string>('pickup');
  private _currency = signal<QuotationCurrency>('CLP');
  private _paymentTerms = signal<PaymentTerms>('contado');
  private _deliveryTerms = signal<DeliveryTerms>('pickup');
  private _validityDays = signal<number>(30);
  private _generalNotes = signal<string>('');
  private _reservationStartedAt = signal<string | null>(null);
  private _ivaPercent = signal<number>(19);
  private _lastRemoved = signal<{ item: QuotationItem; index: number } | null>(null);
  private apiService!: ApiService;

  // ─────────────── SELECTORS (readonly) ───────────────
  items = this._items.asReadonly();
  savedItems = this._savedItems.asReadonly();
  client = this._client.asReadonly();
  step = this._step.asReadonly();
  coupon = this._coupon.asReadonly();
  couponError = this._couponError.asReadonly();
  shippingMethodId = this._shippingMethodId.asReadonly();
  currency = this._currency.asReadonly();
  paymentTerms = this._paymentTerms.asReadonly();
  deliveryTerms = this._deliveryTerms.asReadonly();
  validityDays = this._validityDays.asReadonly();
  generalNotes = this._generalNotes.asReadonly();
  reservationStartedAt = this._reservationStartedAt.asReadonly();
  lastRemoved = this._lastRemoved.asReadonly();
  ivaPercent = this._ivaPercent.asReadonly();

  shippingMethods = SHIPPING_METHODS;

  constructor(private storageService: StorageService) {
    const companyService = inject(CompanyService);
    const apiService = inject(ApiService);

    companyService.getPublicCompany().subscribe({
      next: (res) => {
        if (res.ok && res.data) {
          this._ivaPercent.set(res.data.ivaPercent ?? 19);
        }
      },
    });

    this.apiService = apiService;
    this.loadFromStorage();

    effect(() => {
      const data = {
        items: this._items(),
        savedItems: this._savedItems(),
        client: this._client(),
        coupon: this._coupon(),
        shippingMethodId: this._shippingMethodId(),
        currency: this._currency(),
        paymentTerms: this._paymentTerms(),
        deliveryTerms: this._deliveryTerms(),
        validityDays: this._validityDays(),
        generalNotes: this._generalNotes(),
        reservationStartedAt: this._reservationStartedAt(),
      };
      this.storageService.setItem(STORAGE_KEY, JSON.stringify(data));
    });
  }

  private loadFromStorage() {
    const raw = this.storageService.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      this._items.set(parsed.items ?? []);
      this._savedItems.set(parsed.savedItems ?? []);
      this._client.set(parsed.client ?? null);
      this._coupon.set(parsed.coupon ?? null);
      this._shippingMethodId.set(parsed.shippingMethodId ?? 'pickup');
      this._currency.set(parsed.currency ?? 'CLP');
      this._paymentTerms.set(parsed.paymentTerms ?? 'contado');
      this._deliveryTerms.set(parsed.deliveryTerms ?? 'pickup');
      this._deliveryTerms.set(deliveryTermForShipping(this._shippingMethodId()));
      this._validityDays.set(parsed.validityDays ?? 30);
      this._generalNotes.set(parsed.generalNotes ?? '');
      this._reservationStartedAt.set(parsed.reservationStartedAt ?? null);
    } catch {
      this.clearAll();
    }
  }

  // ─────────────── HELPERS ───────────────
  parsePrice(price: string): number {
    if (!price || price === 'Consultar') return 0;
    return Number(price.replace(/[^\d]/g, '')) || 0;
  }

  // ─────────────── CART ACTIONS ───────────────
  addItem(product: ProductCardData) {
    const priceNum = this.parsePrice(product.price);
    if (priceNum <= 0 || product.price === 'Consultar') {
      this._couponError.set(`"${product.name}" no tiene precio definido. Solicita una cotización personalizada.`);
      return;
    }
    this._couponError.set(null);

    const items = this._items();
    const existing = items.find((i) => i.id === product.id);

    if (existing) {
      const max = existing.maxQty ?? MAX_QTY_DEFAULT;
      this._items.set(
        items.map((i) =>
          i.id === product.id ? { ...i, qty: Math.min(i.qty + 1, max) } : i,
        ),
      );
      this.startReservationIfNeeded();
      return;
    }

    this._items.set([
      ...items,
      {
        ...product,
        qty: 1,
        notes: '',
        addedAt: new Date().toISOString(),
        maxQty: MAX_QTY_DEFAULT,
      },
    ]);
    this.startReservationIfNeeded();
  }

  increaseQty(id: string) {
    this._items.update((items) =>
      items.map((i) => {
        if (i.id !== id) return i;
        const max = i.maxQty ?? MAX_QTY_DEFAULT;
        return { ...i, qty: Math.min(i.qty + 1, max) };
      }),
    );
  }

  decreaseQty(id: string) {
    this._items.update((items) =>
      items.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i,
      ),
    );
  }

  /** Setea cantidad directa, respetando 1 ≤ qty ≤ maxQty. */
  setQty(id: string, qty: number) {
    if (!Number.isFinite(qty)) return;
    this._items.update((items) =>
      items.map((i) => {
        if (i.id !== id) return i;
        const max = i.maxQty ?? MAX_QTY_DEFAULT;
        const clamped = Math.max(1, Math.min(Math.floor(qty), max));
        return { ...i, qty: clamped };
      }),
    );
  }

  setItemNotes(id: string, notes: string) {
    this._items.update((items) =>
      items.map((i) => (i.id === id ? { ...i, notes } : i)),
    );
  }

  removeItem(id: string) {
    const items = this._items();
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const removed = items[idx];
    this._items.set(items.filter((i) => i.id !== id));
    this._lastRemoved.set({ item: removed, index: idx });

    if (this._items().length === 0) {
      this._reservationStartedAt.set(null);
    }
  }

  undoRemove() {
    const last = this._lastRemoved();
    if (!last) return;
    const items = [...this._items()];
    const idx = Math.min(last.index, items.length);
    items.splice(idx, 0, last.item);
    this._items.set(items);
    this._lastRemoved.set(null);
    this.startReservationIfNeeded();
  }

  dismissUndo() {
    this._lastRemoved.set(null);
  }

  clearCart() {
    this._items.set([]);
    this._coupon.set(null);
    this._lastRemoved.set(null);
    this._reservationStartedAt.set(null);
  }

  /** Agrega ítems desde una cotización previa al carrito actual. Omite productos con precio nulo. */
  repeatFromQuote(items: { productId: string; name: string; price: number; quantity: number; sku?: string }[]): void {
    const current = this._items();
    const newItems = items
      .filter((it) => it.price > 0 && it.productId)
      .map((it) => ({
        id: it.productId,
        name: it.name,
        sku: it.sku || '',
        price: String(it.price),
        category: '',
        categorySlug: '',
        shortStatus: '',
        stockLabel: '',
        tags: [] as string[],
        qty: Math.max(1, it.quantity),
        notes: '',
        addedAt: new Date().toISOString(),
        maxQty: MAX_QTY_DEFAULT,
      }));

    for (const item of newItems) {
      const existing = current.find((i) => i.id === item.id);
      if (existing) {
        const max = existing.maxQty ?? MAX_QTY_DEFAULT;
        existing.qty = Math.min(existing.qty + item.qty, max);
      } else {
        current.push(item);
      }
    }

    this._items.set([...current]);
  }

  clearAll() {
    this._items.set([]);
    this._savedItems.set([]);
    this._client.set(null);
    this._step.set(1);
    this._coupon.set(null);
    this._shippingMethodId.set('pickup');
    this._currency.set('CLP');
    this._paymentTerms.set('contado');
    this._deliveryTerms.set('pickup');
    this._validityDays.set(30);
    this._generalNotes.set('');
    this._reservationStartedAt.set(null);
    this._lastRemoved.set(null);
    this.storageService.removeItem(STORAGE_KEY);
  }

  // ─────────────── SAVE FOR LATER ───────────────
  saveForLater(id: string) {
    const item = this._items().find((i) => i.id === id);
    if (!item) return;
    this._items.update((items) => items.filter((i) => i.id !== id));

    const existsSaved = this._savedItems().some((s) => s.id === id);
    if (!existsSaved) {
      this._savedItems.update((s) => [
        ...s,
        { ...item, savedAt: new Date().toISOString() },
      ]);
    }
  }

  moveToCart(id: string) {
    const saved = this._savedItems().find((s) => s.id === id);
    if (!saved) return;
    this._savedItems.update((items) => items.filter((s) => s.id !== id));
    this.addItem(saved);
  }

  removeSavedItem(id: string) {
    this._savedItems.update((items) => items.filter((s) => s.id !== id));
  }

  // ─────────────── COUPON ───────────────
  applyCoupon(code: string): boolean {
    const normalized = (code ?? '').trim().toUpperCase();
    if (!normalized) {
      this._couponError.set('Ingresa un código');
      return false;
    }

    this.apiService
      .post<{ ok: boolean; data?: { code: string; type: string; value: number; description: string; discount: number }; error?: string }>(
        API_CONFIG.endpoints.couponsValidate,
        { code: normalized, subtotal: this.subtotal() },
      )
      .subscribe({
        next: (res) => {
          if (res.ok && res.data) {
            this._coupon.set({
              code: res.data.code,
              type: res.data.type as 'percentage' | 'fixed',
              value: res.data.value,
              description: res.data.description,
              discount: res.data.discount,
            });
            this._couponError.set(null);
          } else {
            this._couponError.set(res.error || 'Cupón no válido');
          }
        },
        error: () => {
          this._couponError.set('Error al validar cupón');
        },
      });

    return true; // optimistic, el error se muestra vía couponError
  }

  removeCoupon() {
    this._coupon.set(null);
    this._couponError.set(null);
  }

  // ─────────────── SHIPPING ───────────────
  setShippingMethod(id: string) {
    if (!SHIPPING_METHODS.some((m) => m.id === id)) return;
    this._shippingMethodId.set(id);
    this._deliveryTerms.set(deliveryTermForShipping(id));
  }

  shippingMethod = computed<ShippingMethod>(
    () =>
      SHIPPING_METHODS.find((m) => m.id === this._shippingMethodId()) ??
      SHIPPING_METHODS[0],
  );

  // ─────────────── DOC SETTINGS ───────────────
  setCurrency(c: QuotationCurrency) {
    this._currency.set(c);
  }
  setPaymentTerms(t: PaymentTerms) {
    this._paymentTerms.set(t);
  }
  setDeliveryTerms(t: DeliveryTerms) {
    this._deliveryTerms.set(t);
    this._shippingMethodId.set(shippingMethodForDelivery(t, this._shippingMethodId()));
  }
  setValidityDays(d: number) {
    if (!Number.isFinite(d) || d < 1) return;
    this._validityDays.set(Math.floor(d));
  }
  setGeneralNotes(n: string) {
    this._generalNotes.set(n);
  }

  // ─────────────── RESERVATION TIMER ───────────────
  private startReservationIfNeeded() {
    if (!this._reservationStartedAt()) {
      this._reservationStartedAt.set(new Date().toISOString());
    }
  }

  reservationExpiresAt = computed<string | null>(() => {
    const start = this._reservationStartedAt();
    if (!start) return null;
    const expires = new Date(new Date(start).getTime() + RESERVATION_MINUTES * 60_000);
    return expires.toISOString();
  });

  // ─────────────── CLIENT ───────────────
  setClient(data: QuotationClient) {
    this._client.set(data);
  }

  // ─────────────── STEP CONTROL ───────────────
  setStep(step: number) {
    if (!this.canGoToStep(step)) return;
    this._step.set(step);
  }

  nextStep() {
    const next = this._step() + 1;
    if (this.canGoToStep(next)) {
      this._step.set(next);
    }
  }

  prevStep() {
    this._step.update((s) => Math.max(s - 1, 1));
  }

  // ─────────────── COMPUTED TOTALS ───────────────
  subtotal = computed(() =>
    this._items().reduce(
      (acc, item) => acc + this.parsePrice(item.price) * item.qty,
      0,
    ),
  );

  discount = computed(() => {
    const coupon = this._coupon();
    if (!coupon) return 0;
    const sub = this.subtotal();
    if (coupon.minSubtotal && sub < coupon.minSubtotal) return 0;
    if (coupon.type === 'percentage') {
      return Math.round((sub * coupon.value) / 100);
    }
    return Math.min(coupon.value, sub);
  });

  taxableBase = computed(() => Math.max(0, this.subtotal() - this.discount()));

  iva = computed(() => Math.round(this.taxableBase() * this.ivaPercent() / 100));

  shippingCost = computed(() => this.shippingMethod().cost);

  total = computed(() => this.taxableBase() + this.iva() + this.shippingCost());

  totalItems = computed(() => this._items().reduce((acc, i) => acc + i.qty, 0));

  uniqueItems = computed(() => this._items().length);

  hasItems = computed(() => this._items().length > 0);

  validUntilDate = computed<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + this._validityDays());
    return d.toISOString();
  });

  // ─────────────── BACKEND PAYLOAD ───────────────
  /**
   * Construye el payload para POST /quotes.
   * Mantiene la forma "minima" compatible con el backend (client, items, totals, metadata)
   * y agrega información extra como campo `extra` que el backend puede ignorar
   * sin romper la validación.
   */
  buildPayload() {
    const c = this._client();

    const minimalClient = c
      ? {
          name: c.name,
          email: c.email,
          phone: c.phone ?? '',
          company: c.company ?? '',
          notes: c.notes ?? '',
        }
      : null;

    return {
      client: minimalClient,

      items: this._items().map((i) => ({
        productId: i.id,
        name: i.name,
        price: this.parsePrice(i.price),
        quantity: i.qty,
        total: this.parsePrice(i.price) * i.qty,
      })),

      totals: {
        subtotal: this.subtotal(),
        iva: this.iva(),
        total: this.total(),
      },

      metadata: {
        createdAt: new Date().toISOString(),
        status: 'sent',
      },

      // Información adicional — opcional, el backend puede ignorarla.
      extra: {
        customerType: c?.customerType,
        taxId: c?.taxId,
        businessActivity: c?.businessActivity,
        billingAddress: c?.billingAddress,
        shippingAddress: c?.shippingAddress,
        shippingSameAsBilling: c?.shippingSameAsBilling,
        acceptsTerms: c?.acceptsTerms,
        acceptsMarketing: c?.acceptsMarketing,
        itemNotes: this._items().map((i) => ({ productId: i.id, note: i.notes ?? '' })),
        coupon: this._coupon(),
        discount: this.discount(),
        shipping: {
          method: this.shippingMethod(),
          cost: this.shippingCost(),
        },
        currency: this._currency(),
        paymentTerms: this._paymentTerms(),
        deliveryTerms: this._deliveryTerms(),
        validUntil: this.validUntilDate(),
        validityDays: this._validityDays(),
        generalNotes: this._generalNotes(),
      },
    };
  }

  canGoToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return this._items().length > 0;
      case 3:
        return this._items().length > 0 && !!this._client();
      case 4:
        return this._items().length > 0 && !!this._client();
      default:
        return true;
    }
  };
}
