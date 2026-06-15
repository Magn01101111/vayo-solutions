import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  /** Título corto y específico de la acción. Ej: "Eliminar producto". */
  title: string;
  /** Mensaje explicativo. Ej: "Esta acción no se puede deshacer." */
  message?: string;
  /** Texto del botón de confirmación. Por defecto "Confirmar". */
  confirmLabel?: string;
  /** Texto del botón de cancelar. Por defecto "Cancelar". */
  cancelLabel?: string;
  /** Tono visual del botón de confirmación. 'danger' (rojo) por defecto. */
  tone?: 'danger' | 'primary';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

/**
 * Diálogo de confirmación global y reutilizable.
 *
 * Uso (en cualquier componente):
 *   private confirm = inject(ConfirmService);
 *   const ok = await this.confirm.ask({
 *     title: 'Eliminar producto',
 *     message: '¿Eliminar "Compresor X"? Esta acción no se puede deshacer.',
 *     confirmLabel: 'Eliminar',
 *     tone: 'danger',
 *   });
 *   if (!ok) return;
 *   // …proceder
 *
 * Requiere que <vayo-confirm /> esté montado una vez por shell.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _state = signal<ConfirmState>({ open: false, title: '' });
  readonly state = this._state.asReadonly();

  private resolver: ((value: boolean) => void) | null = null;

  ask(opts: ConfirmOptions): Promise<boolean> {
    // Si había un diálogo abierto sin resolver, lo cancela.
    this.resolver?.(false);
    this._state.set({ ...opts, open: true });
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  accept(): void {
    this.settle(true);
  }

  cancel(): void {
    this.settle(false);
  }

  private settle(result: boolean): void {
    if (!this._state().open) return;
    this._state.update((s) => ({ ...s, open: false }));
    const resolve = this.resolver;
    this.resolver = null;
    resolve?.(result);
  }
}
