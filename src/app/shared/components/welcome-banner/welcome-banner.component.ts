import { Component, output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const FLAG_KEY = 'vayo_seen_welcome';

@Component({
  selector: 'app-welcome-banner',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="wb-banner" role="banner" aria-label="Oferta de bienvenida">
      <div class="wb-banner__body">
        <div class="wb-banner__icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/>
            <path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
            <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
          </svg>
        </div>
        <div class="wb-banner__text">
          <p class="wb-banner__headline">Primera visita — regalo especial</p>
          <p class="wb-banner__sub">
            Crea tu cuenta y obtén <strong>15% de descuento</strong> en tu primera cotización, de forma automática.
          </p>
        </div>
      </div>
      <div class="wb-banner__actions">
        <a
          routerLink="/registro"
          [queryParams]="{ welcome: '1' }"
          class="wb-banner__cta"
          (click)="dismiss()"
        >
          Reclamar regalo
        </a>
        <button type="button" class="wb-banner__later" (click)="dismiss()">
          Quizás luego
        </button>
      </div>
      <button type="button" class="wb-banner__close" aria-label="Cerrar" (click)="dismiss()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .wb-banner {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
      padding: var(--space-4) var(--space-5);
      background: linear-gradient(135deg, var(--navy) 0%, color-mix(in srgb, var(--navy) 80%, var(--blue)) 100%);
      border-bottom: 3px solid var(--amber);
      color: #fff;
    }

    .wb-banner__body {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex: 1;
      min-width: 0;
    }

    .wb-banner__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px; height: 48px;
      background: rgba(255,255,255,.1);
      border-radius: var(--r-sm);
      flex-shrink: 0;
      color: var(--amber);
    }

    .wb-banner__text { min-width: 0; }

    .wb-banner__headline {
      font-size: var(--fs-xs);
      font-weight: var(--fw-bold);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--amber);
      margin: 0 0 2px;
    }

    .wb-banner__sub {
      font-size: var(--fs-sm);
      color: rgba(255,255,255,.85);
      margin: 0;
      strong { color: #fff; }
    }

    .wb-banner__actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-shrink: 0;
    }

    .wb-banner__cta {
      display: inline-flex;
      align-items: center;
      padding: var(--space-2) var(--space-4);
      background: var(--amber);
      color: var(--navy);
      font-size: var(--fs-sm);
      font-weight: var(--fw-bold);
      border-radius: var(--r-xs);
      text-decoration: none;
      transition: opacity var(--t-fast);
      &:hover { opacity: .88; }
    }

    .wb-banner__later {
      background: none;
      border: none;
      color: rgba(255,255,255,.6);
      font-size: var(--fs-sm);
      cursor: pointer;
      padding: 0;
      &:hover { color: #fff; }
    }

    .wb-banner__close {
      position: absolute;
      top: var(--space-2);
      right: var(--space-3);
      background: none;
      border: none;
      color: rgba(255,255,255,.5);
      cursor: pointer;
      padding: 4px;
      display: flex;
      &:hover { color: #fff; }
    }

    @media (max-width: 640px) {
      .wb-banner { flex-direction: column; align-items: flex-start; }
      .wb-banner__close { top: var(--space-3); }
    }
  `],
})
export class WelcomeBannerComponent {
  private authSvc = inject(AuthService);
  dismissed = output<void>();

  static shouldShow(authSvc: AuthService): boolean {
    if (authSvc.currentUser) return false;
    if (typeof localStorage === 'undefined') return false;
    return !localStorage.getItem(FLAG_KEY);
  }

  dismiss(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FLAG_KEY, '1');
    }
    this.dismissed.emit();
  }
}
