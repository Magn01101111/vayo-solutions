import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toastSvc.toasts().length > 0">
      <div
        *ngFor="let t of toastSvc.toasts()"
        class="toast"
        [class.toast--success]="t.type === 'success'"
        [class.toast--error]="t.type === 'error'"
        [class.toast--info]="t.type === 'info'"
        (click)="toastSvc.dismiss(t.id)"
      >
        {{ t.message }}
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 360px;
    }
    .toast {
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      cursor: pointer;
      animation: toastIn 0.3s ease;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .toast--success { background: #2e7d32; color: #fff; }
    .toast--error   { background: #c62828; color: #fff; }
    .toast--info    { background: #1565c0; color: #fff; }
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(1rem); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class ToastContainerComponent {
  toastSvc = inject(ToastService);
}
