import { Injectable, computed, effect, signal } from '@angular/core';
import { ProductCardData } from '../../core/models/ui.models';
import { QuotationItem, QuotationClient } from '../../core/models/app.models';
import { StorageService } from './storage.service';
const STORAGE_KEY = 'vayo_quote';
@Injectable({
  providedIn: 'root',
})
export class QuotationService {
  constructor(private storageService: StorageService) {
    this.loadFromStorage();

    effect(() => {
      const data = {
        items: this._items(),
        client: this._client(),
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
      this._client.set(parsed.client ?? null);
    } catch {
      this.clearCart();
    }
  }

  clearAll() {
    this._items.set([]);
    this._client.set(null);
    this._step.set(1);
    this.storageService.removeItem(STORAGE_KEY);
  }

  // 🔹 STATE
  private _items = signal<QuotationItem[]>([]);
  private _client = signal<QuotationClient | null>(null);
  private _step = signal<number>(1);

  // 🔹 SELECTORS (readonly)
  items = this._items.asReadonly();
  client = this._client.asReadonly();
  step = this._step.asReadonly();

  // 🔹 HELPERS
  private parsePrice(price: string): number {
    if (!price || price === 'Consultar') return 0;
    return Number(price.replace(/[^\d]/g, '')) || 0;
  }

  // 🔹 CART ACTIONS
  addItem(product: ProductCardData) {
    const items = this._items();
    const existing = items.find((i) => i.id === product.id);

    if (existing) {
      existing.qty++;
      this._items.set([...items]);
      return;
    }

    this._items.set([...items, { ...product, qty: 1 }]);
  }

  increaseQty(id: string) {
    this._items.update((items) =>
      items.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)),
    );
  }

  decreaseQty(id: string) {
    this._items.update((items) =>
      items.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i,
      ),
    );
  }

  removeItem(id: string) {
    this._items.update((items) => items.filter((i) => i.id !== id));
  }

  clearCart() {
    this._items.set([]);
  }

  // 🔹 CLIENT
  setClient(data: QuotationClient) {
    this._client.set(data);
  }

  // 🔹 STEP CONTROL
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

  subtotal = computed(() =>
    this._items().reduce(
      (acc, item) => acc + this.parsePrice(item.price) * item.qty,
      0,
    ),
  );

  iva = computed(() => Math.round(this.subtotal() * 0.19));

  total = computed(() => this.subtotal() + this.iva());

  totalItems = computed(() => this._items().reduce((acc, i) => acc + i.qty, 0));

  // 🔹 BACKEND READY (clave)
  buildPayload() {
  return {
    client: this._client(),

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
