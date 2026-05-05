import { Injectable, inject } from '@angular/core';
import { Observable, of, shareReplay, tap, finalize } from 'rxjs';

import { StorageService } from './storage.service';

/**
 * Servicio de caché en dos capas:
 *
 *   1. **Memoria (in-memory)** — vive solo durante la sesión del navegador.
 *      Sirve para deduplicar requests concurrentes con `shareReplay()`.
 *
 *   2. **localStorage con TTL** — sobrevive a recargas del navegador.
 *      Sirve para evitar volver a llamar al backend al refrescar.
 *
 * Uso típico desde un service:
 *
 *   getCategories(): Observable<...> {
 *     return this.cache.wrap(
 *       'categories:active',
 *       () => this.api.get(...),
 *       5 * 60 * 1000  // TTL 5 min
 *     );
 *   }
 *
 *   // Y al crear/editar/borrar:
 *   this.cache.invalidate('categories:active');
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const STORAGE_PREFIX = 'vayo_cache:';

@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly storage = inject(StorageService);

  /** Capa 1: memoria — guarda Observables en vuelo (shareReplay). */
  private readonly inflight = new Map<string, Observable<any>>();

  /** Capa 2: snapshot de cada key → no andamos parseando JSON 100 veces. */
  private readonly memorySnapshot = new Map<string, CacheEntry<any>>();

  // ── API pública ───────────────────────────────────────────────────────────

  /**
   * Wrapping idiomático: si hay valor cacheado vigente, lo devuelve;
   * si no, ejecuta `factory()` y cachea su resultado.
   *
   * Garantiza que requests concurrentes a la misma key compartan el resultado
   * (no se dispara el factory dos veces si llegan al mismo tiempo).
   */
  wrap<T>(key: string, factory: () => Observable<T>, ttlMs: number): Observable<T> {
    // 1. ¿Tenemos un valor todavía vigente en memoria/localStorage?
    const cached = this.get<T>(key);
    if (cached !== null) {
      return of(cached);
    }

    // 2. ¿Hay ya una request en vuelo para esta key? Compartirla.
    const existing = this.inflight.get(key);
    if (existing) return existing as Observable<T>;

    // 3. Nuevo fetch — cacheamos el observable mientras dure
    const obs$ = factory().pipe(
      tap((value) => this.set(key, value, ttlMs)),
      shareReplay({ bufferSize: 1, refCount: false }),
      finalize(() => this.inflight.delete(key)),
    );

    this.inflight.set(key, obs$);
    return obs$;
  }

  /** Lee del cache. Devuelve `null` si no existe o expiró. */
  get<T>(key: string): T | null {
    // Memoria primero (sin parsear JSON)
    const mem = this.memorySnapshot.get(key);
    if (mem) {
      if (Date.now() < mem.expiresAt) return mem.value as T;
      this.memorySnapshot.delete(key);
    }

    // localStorage como fallback
    const raw = this.storage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;

    try {
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (Date.now() > entry.expiresAt) {
        this.storage.removeItem(STORAGE_PREFIX + key);
        return null;
      }
      this.memorySnapshot.set(key, entry);
      return entry.value;
    } catch {
      this.storage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
  }

  /** Guarda un valor con TTL en milisegundos. */
  set<T>(key: string, value: T, ttlMs: number): void {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
    this.memorySnapshot.set(key, entry);
    try {
      this.storage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // localStorage lleno o privacidad bloqueada → solo memoria
    }
  }

  /** Borra una clave específica. Llamar tras cualquier mutación del recurso. */
  invalidate(key: string): void {
    this.memorySnapshot.delete(key);
    this.inflight.delete(key);
    this.storage.removeItem(STORAGE_PREFIX + key);
  }

  /**
   * Borra todas las claves con un prefijo dado.
   * Ej: invalidatePrefix('products:') borra todas las queries de productos.
   */
  invalidatePrefix(prefix: string): void {
    // Memoria
    for (const key of Array.from(this.memorySnapshot.keys())) {
      if (key.startsWith(prefix)) this.memorySnapshot.delete(key);
    }
    for (const key of Array.from(this.inflight.keys())) {
      if (key.startsWith(prefix)) this.inflight.delete(key);
    }

    // localStorage — buscamos todas las claves que matcheen
    if (typeof localStorage !== 'undefined') {
      const fullPrefix = STORAGE_PREFIX + prefix;
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(fullPrefix)) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    }
  }

  /** Limpia todo el caché de la app. Útil al hacer logout. */
  clearAll(): void {
    this.memorySnapshot.clear();
    this.inflight.clear();
    this.invalidatePrefix('');
  }
}
