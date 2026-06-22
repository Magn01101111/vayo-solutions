import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmService } from './confirm.service';

export interface FeedbackOutcomeAction {
  label: string;
  route?: any[];
  dismiss?: boolean;
  tone?: 'primary' | 'ghost';
}

export interface FeedbackOutcome {
  title: string;
  message?: string;
  actions: FeedbackOutcomeAction[];
  tone?: 'success' | 'danger' | 'primary';
}

export interface FeedbackConfig<T> {
  confirm: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'primary';
  };
  action: () => Promise<T>;
  outcome: (result: T) => FeedbackOutcome;
  onError?: (e: unknown) => FeedbackOutcome;
}

interface ResultState {
  open: boolean;
  outcome: FeedbackOutcome | null;
}

@Injectable({ providedIn: 'root' })
export class ActionFeedbackService {
  private readonly confirmSvc = inject(ConfirmService);
  private readonly router = inject(Router);

  private readonly _state = signal<ResultState>({ open: false, outcome: null });
  readonly state = this._state.asReadonly();

  private resolver: (() => void) | null = null;

  async run<T>(config: FeedbackConfig<T>): Promise<void> {
    const confirmed = await this.confirmSvc.ask({
      title: config.confirm.title,
      message: config.confirm.message,
      confirmLabel: config.confirm.confirmLabel,
      cancelLabel: config.confirm.cancelLabel,
      tone: config.confirm.tone ?? 'primary',
    });

    if (!confirmed) return;

    let outcome: FeedbackOutcome;
    try {
      const result = await config.action();
      outcome = config.outcome(result);
    } catch (e) {
      outcome = config.onError
        ? config.onError(e)
        : { title: 'Error', message: 'Ocurrió un error inesperado.', actions: [{ label: 'Cerrar', dismiss: true }], tone: 'danger' };
    }

    this._state.set({ open: true, outcome });
    return new Promise<void>((resolve) => { this.resolver = resolve; });
  }

  handleAction(action: FeedbackOutcomeAction): void {
    if (action.route) {
      this.router.navigate(action.route);
    }
    if (action.dismiss !== false) {
      this.close();
    }
  }

  close(): void {
    this._state.set({ open: false, outcome: null });
    const resolve = this.resolver;
    this.resolver = null;
    resolve?.();
  }
}
