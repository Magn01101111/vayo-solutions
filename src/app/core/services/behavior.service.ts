import { Injectable } from '@angular/core';

const STORAGE_KEY = 'vayo_behavior';
const MAX_RECENT = 20;
const DECAY = 0.85;

/**
 * Forma mínima que necesita el tracking. Compatible estructuralmente con
 * `ProductCardData` y `ProductDetailData` (ambos exponen estos campos).
 */
export interface TrackableProduct {
  id: string;
  category?: string;
  categorySlug?: string;
  tags?: string[];
}

interface BehaviorStore {
  categories: Record<string, number>;
  tags: Record<string, number>;
  recentProductIds: string[];
}

function emptyStore(): BehaviorStore {
  return { categories: {}, tags: {}, recentProductIds: [] };
}

@Injectable({ providedIn: 'root' })
export class BehaviorService {
  private store: BehaviorStore = emptyStore();

  constructor() {
    this.load();
  }

  trackProductView(product: TrackableProduct): void {
    const slug = product.categorySlug ?? product.category ?? '';
    if (slug) this.increment('categories', slug);
    for (const tag of product.tags ?? []) this.increment('tags', tag);

    const ids = this.store.recentProductIds.filter((id) => id !== product.id);
    ids.unshift(product.id);
    this.store.recentProductIds = ids.slice(0, MAX_RECENT);
    this.save();
  }

  trackCategory(slug: string): void {
    if (!slug) return;
    this.increment('categories', slug);
    this.save();
  }

  topCategories(n = 5): string[] {
    return this.topKeys(this.store.categories, n);
  }

  topTags(n = 5): string[] {
    return this.topKeys(this.store.tags, n);
  }

  recent(): string[] {
    return [...this.store.recentProductIds];
  }

  private increment(field: 'categories' | 'tags', key: string): void {
    const map = this.store[field];
    // Decaimiento suave de todos los scores antes de sumar 1 al nuevo
    for (const k of Object.keys(map)) map[k] = +(map[k] * DECAY).toFixed(4);
    map[key] = (map[key] ?? 0) + 1;
  }

  private topKeys(map: Record<string, number>, n: number): string[] {
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
      .map(([k]) => k);
  }

  private load(): void {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) this.store = { ...emptyStore(), ...JSON.parse(raw) };
    } catch {
      this.store = emptyStore();
    }
  }

  private save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
      }
    } catch {}
  }
}
