import { Component, HostListener, inject } from '@angular/core';
import { ActionFeedbackService } from '../../../core/services/action-feedback.service';

/**
 * Modal de resultado de acción. Se monta una vez por shell, junto a <vayo-confirm>.
 * Muestra el outcome de ActionFeedbackService tras ejecutar una acción.
 */
@Component({
  selector: 'vayo-action-result',
  standalone: true,
  template: `
    @if (svc.state(); as st) {
      @if (st.open && st.outcome) {
        <div class="vc-backdrop" (click)="svc.close()" aria-hidden="true"></div>

        <div
          class="vc-dialog"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="st.outcome.title"
        >
          <div
            class="vc-dialog__head"
            [class.vc-dialog__head--success]="!st.outcome.tone || st.outcome.tone === 'success'"
            [class.vc-dialog__head--danger]="st.outcome.tone === 'danger'"
          >
            <span class="vc-dialog__icon" aria-hidden="true">
              @if (!st.outcome.tone || st.outcome.tone === 'success') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              } @else if (st.outcome.tone === 'danger') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              } @else {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              }
            </span>
            <h3 class="vc-dialog__title">{{ st.outcome.title }}</h3>
          </div>

          @if (st.outcome.message) {
            <div class="vc-dialog__body">
              <p>{{ st.outcome.message }}</p>
            </div>
          }

          <div class="vc-dialog__foot">
            @for (action of st.outcome.actions; track action.label) {
              <button
                type="button"
                class="btn btn--sm"
                [class.btn--primary]="!action.tone || action.tone === 'primary'"
                [class.btn--ghost]="action.tone === 'ghost'"
                (click)="svc.handleAction(action)"
              >
                {{ action.label }}
              </button>
            }
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
    .vc-dialog__head--success .vc-dialog__icon {
      background: var(--success-bg, #d1fae5); color: var(--success, #059669);
    }
    .vc-dialog__head--danger .vc-dialog__icon {
      background: var(--danger-bg); color: var(--danger);
    }
    .vc-dialog__head:not(.vc-dialog__head--success):not(.vc-dialog__head--danger) .vc-dialog__icon {
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
export class VayoActionResultComponent {
  readonly svc = inject(ActionFeedbackService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.svc.state().open) this.svc.close();
  }
}
