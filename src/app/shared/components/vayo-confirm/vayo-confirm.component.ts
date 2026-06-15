import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '../../../core/services/confirm.service';

/**
 * Host del diálogo de confirmación. Se monta UNA vez por shell
 * (admin-shell + public-shell) y escucha el estado de ConfirmService.
 */
@Component({
  selector: 'vayo-confirm',
  standalone: true,
  template: `
    @if (svc.state(); as st) {
      @if (st.open) {
        <div class="vc-backdrop" (click)="svc.cancel()" aria-hidden="true"></div>

        <div
          class="vc-dialog"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="st.title"
        >
          <div class="vc-dialog__head" [class.vc-dialog__head--danger]="st.tone !== 'primary'">
            <span class="vc-dialog__icon" aria-hidden="true">
              @if (st.tone !== 'primary') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              } @else {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              }
            </span>
            <h3 class="vc-dialog__title">{{ st.title }}</h3>
          </div>

          @if (st.message) {
            <div class="vc-dialog__body">
              <p>{{ st.message }}</p>
            </div>
          }

          <div class="vc-dialog__foot">
            <button type="button" class="btn btn--ghost btn--sm" (click)="svc.cancel()">
              {{ st.cancelLabel || 'Cancelar' }}
            </button>
            <button
              type="button"
              class="btn btn--sm"
              [class.btn--danger]="st.tone !== 'primary'"
              [class.btn--primary]="st.tone === 'primary'"
              (click)="svc.accept()"
            >
              {{ st.confirmLabel || 'Confirmar' }}
            </button>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    :host { display: contents; }

    .vc-backdrop {
      position: fixed; inset: 0;
      background: rgba(10, 24, 40, .55);
      z-index: 500;
      animation: vc-fade var(--t-fast);
    }
    @keyframes vc-fade { from { opacity: 0; } to { opacity: 1; } }

    .vc-dialog {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: 501;
      width: min(420px, calc(100vw - var(--space-8)));
      background: var(--paper);
      border: var(--bw) solid var(--line);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: vc-pop var(--t-base);
    }
    @keyframes vc-pop {
      from { opacity: 0; transform: translate(-50%, calc(-50% - 8px)); }
      to   { opacity: 1; transform: translate(-50%, -50%); }
    }

    .vc-dialog__head {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-5) var(--space-5) var(--space-3);
    }

    .vc-dialog__icon {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px;
      border-radius: var(--r-xs);
      flex: none;
    }
    .vc-dialog__head--danger .vc-dialog__icon {
      background: var(--danger-bg); color: var(--danger);
    }
    .vc-dialog__head:not(.vc-dialog__head--danger) .vc-dialog__icon {
      background: var(--blue-50); color: var(--blue);
    }

    .vc-dialog__title {
      font-size: var(--fs-h3);
      font-weight: var(--fw-bold);
      color: var(--ink);
      letter-spacing: var(--ls-snug);
    }

    .vc-dialog__body {
      padding: 0 var(--space-5) var(--space-2);
      p { font-size: var(--fs-sm); color: var(--ink-2); line-height: 1.6; }
    }

    .vc-dialog__foot {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-5);
      border-top: var(--bw) solid var(--line-2);
      background: var(--paper-2);
      margin-top: var(--space-3);
    }

    @media (max-width: 576px) {
      .vc-dialog {
        top: auto; bottom: 0; left: 0;
        transform: none;
        width: 100%;
        border-radius: var(--r-lg) var(--r-lg) 0 0;
        animation: vc-up var(--t-base);
      }
      @keyframes vc-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    }
  `],
})
export class VayoConfirmComponent {
  readonly svc = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.svc.state().open) this.svc.cancel();
  }
}
