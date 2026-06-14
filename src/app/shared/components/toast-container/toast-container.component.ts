import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    @if (toastSvc.toasts().length > 0) {
      <div class="toast-container" role="status" aria-live="polite" aria-atomic="false">
        @for (t of toastSvc.toasts(); track t.id) {
          <div
            class="toast"
            [class.toast--ok]="t.type === 'success'"
            [class.toast--danger]="t.type === 'error'"
            [class.toast--info]="t.type === 'info'"
            (click)="toastSvc.dismiss(t.id)"
            role="alert"
          >
            <span class="toast__dot" aria-hidden="true"></span>
            <span class="toast__msg">{{ t.message }}</span>
            <button type="button" class="toast__close" aria-label="Cerrar notificación">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 360px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--r-lg);
      font-size: var(--fs-sm);
      font-family: var(--font-sans);
      cursor: pointer;
      pointer-events: all;
      animation: toastIn var(--t-base, .2s) ease;
      box-shadow: var(--shadow-lg);
      border: 1px solid transparent;
    }

    .toast--ok {
      background: var(--ok-bg);
      color: var(--ok);
      border-color: var(--ok-line);
    }

    .toast--danger {
      background: var(--danger-bg);
      color: var(--danger);
      border-color: var(--danger-line);
    }

    .toast--info {
      background: var(--blue-50);
      color: var(--blue-700);
      border-color: var(--blue-100);
    }

    .toast__dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      flex: none;
      opacity: .8;
    }

    .toast__msg {
      flex: 1;
      font-weight: 500;
    }

    .toast__close {
      background: none;
      border: none;
      padding: 2px;
      cursor: pointer;
      color: currentColor;
      opacity: .6;
      display: flex;
      align-items: center;
      flex: none;

      &:hover { opacity: 1; }
    }

    @keyframes toastIn {
      from { opacity: 0; transform: translateY(8px) scale(.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `],
})
export class ToastContainerComponent {
  readonly toastSvc = inject(ToastService);
}
