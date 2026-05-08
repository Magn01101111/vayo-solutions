import { Injectable, computed, effect, signal } from '@angular/core';
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

const STORAGE_KEY = 'vayo_quote';

const MAX_QTY_DEFAULT = 999;
const RESERVATION_MINUTES = 15;

const AVAILABLE_COUPONS: Coupon[] = [
  { code: 'VAYO5', type: 'percentage', value: 5, description: '5% de descuento' },
  { code: 'VAYO10', type: 'percentage', value: 10, minSubtotal: 100000, description: '10% sobre $100.000+' },
  { code: 'VAYO15', type: 'percentage', value: 15, minSubtotal: 500000, description: '15% sobre $500.000+' },
  { code: 'BIENVENIDO', type: 'fixed', value: 10000, description: '$10.000 de descuento' },
];

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: 'pickup', label: 'Retiro en tienda', description: 'Sin costo, retira en sucursal', cost: 0, estimatedDays: 'Mismo día' },
  { id: 'rm', label: 'Despacho Región Metropolitana', cost: 8990, estimatedDays: '1-2 días hábiles' },
  { id: 'national', label: 'Despacho nacional', cost: 14990, estimatedDays: '3-5 días hábiles' },
  { id: 'express', label: 'Express 24h', cost: 24990, estimatedDays: '24 horas' },
];

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
  private _lastRemoved = signal<{ item: QuotationItem; index: number } | null>(null);

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

  availableCoupons = AVAILABLE_COUPONS;
  shippingMethods = SHIPPING_METHODS;

  constructor(private storageService: StorageService) {
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
    const found = AVAILABLE_COUPONS.find((c) => c.code === normalized);
    if (!found) {
      this._couponError.set('Código no válido');
      return false;
    }
    if (found.minSubtotal && this.subtotal() < found.minSubtotal) {
      this._couponError.set(
        `Requiere subtotal mínimo de $${found.minSubtotal.toLocaleString('es-CL')}`,
      );
      return false;
    }
    this._coupon.set(found);
    this._couponError.set(null);
    return true;
  }

  removeCoupon() {
    this._coupon.set(null);
    this._couponError.set(null);
  }

  // ─────────────── SHIPPING ───────────────
  setShippingMethod(id: string) {
    if (!SHIPPING_METHODS.some((m) => m.id === id)) return;
    this._shippingMethodId.set(id);
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

  iva = computed(() => Math.round(this.taxableBase() * 0.19));

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
  buildPayload() {
    return {
      client: this._client(),

      items: this._items().map((i) => ({
        productId: i.id,
        name: i.name,
        sku: i.sku,
        price: this.parsePrice(i.price),
        quantity: i.qty,
        notes: i.notes ?? '',
        total: this.parsePrice(i.price) * i.qty,
      })),

      totals: {
        subtotal: this.subtotal(),
        discount: this.discount(),
        taxableBase: this.taxableBase(),
        iva: this.iva(),
        shipping: this.shippingCost(),
        total: this.total(),
      },

      coupon: this._coupon(),
      shippingMethod: this.shippingMethod(),
      currency: this._currency(),
      paymentTerms: this._paymentTerms(),
      deliveryTerms: this._deliveryTerms(),
      validUntil: this.validUntilDate(),
      notes: this._generalNotes(),

      metadata: {
        createdAt: new Date().toISOString(),
        status: 'sent',
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
