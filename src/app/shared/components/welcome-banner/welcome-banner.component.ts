import { Component, HostListener, output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const FLAG_KEY = 'vayo_seen_welcome';

/**
 * Modal de bienvenida (primera visita, usuario no logueado).
 * Aparece sobre un backdrop oscuro con foco total en "crear cuenta y reclamar
 * el 15%". Conserva la API estática `shouldShow()` y el output `dismissed`
 * para que el Home no requiera cambios.
 */
@Component({
  selector: 'app-welcome-banner',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="wb-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wb-title"
      (click)="onBackdrop($event)"
    >
      <div class="wb-modal" role="document">
        <!-- Cabecera navy con rejilla blueprint -->
        <div class="wb-modal__head">
          <div class="wb-modal__grid" aria-hidden="true"></div>

          <button
            type="button"
            class="wb-modal__close"
            aria-label="Cerrar"
            (click)="dismiss()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <span class="wb-modal__eyebrow">Regalo de bienvenida</span>

          <div class="wb-modal__offer" aria-hidden="true">
            <span class="wb-modal__pct">15<small>%</small></span>
            <span class="wb-modal__pctlabel">de descuento</span>
          </div>

          <div class="wb-modal__gift" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/>
              <path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
        </div>

        <!-- Cuerpo -->
        <div class="wb-modal__body">
          <h2 class="wb-modal__title" id="wb-title">Por ser tu primera vez en VAYO</h2>
          <p class="wb-modal__text">
            Crea tu cuenta y recibe <strong>15% de descuento</strong> en tu primera
            cotización, aplicado automáticamente. Además guardas tus datos para cotizar
            más rápido la próxima vez.
          </p>

          <ul class="wb-modal__perks">
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              Cupón automático en tu primera compra
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              Historial y descarga de cotizaciones en PDF
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              Datos guardados para cotizar en segundos
            </li>
          </ul>

          <div class="wb-modal__actions">
            <a
              routerLink="/registro"
              [queryParams]="{ welcome: '1' }"
              class="wb-modal__cta"
              (click)="dismiss()"
            >
              Crear cuenta y reclamar
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <button type="button" class="wb-modal__later" (click)="dismiss()">
              Quizás más tarde
            </button>
          </div>

          <p class="wb-modal__fine">Sin costo. Solo necesitas un correo para empezar.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Backdrop ─────────────────────────────────────────────── */
    .wb-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
      background: rgba(6, 14, 24, .62);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      animation: wb-fade .2s ease both;
    }

    /* ── Tarjeta ──────────────────────────────────────────────── */
    .wb-modal {
      position: relative;
      width: min(100%, 460px);
      max-height: calc(100dvh - var(--space-8));
      overflow-y: auto;
      background: var(--paper);
      border: var(--bw) solid var(--line);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-lg);
      animation: wb-pop .26s cubic-bezier(.2, .9, .3, 1.1) both;
    }

    /* ── Cabecera navy + blueprint ────────────────────────────── */
    .wb-modal__head {
      position: relative;
      overflow: hidden;
      padding: var(--space-6) var(--space-6) var(--space-5);
      background: linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%);
      border-bottom: var(--bw-3) solid var(--amber);
    }

    .wb-modal__grid {
      position: absolute;
      inset: 0;
      opacity: .5;
      background-image:
        linear-gradient(var(--blueprint-line) 1px, transparent 1px),
        linear-gradient(90deg, var(--blueprint-line) 1px, transparent 1px);
      background-size: 28px 28px;
      pointer-events: none;
    }

    .wb-modal__close {
      position: absolute;
      top: var(--space-3);
      right: var(--space-3);
      z-index: 2;
      display: flex;
      padding: 6px;
      border: none;
      border-radius: var(--r);
      background: rgba(255, 255, 255, .08);
      color: rgba(255, 255, 255, .7);
      cursor: pointer;
      transition: background var(--t-fast), color var(--t-fast);
      &:hover { background: rgba(255, 255, 255, .16); color: #fff; }
    }

    .wb-modal__eyebrow {
      position: relative;
      display: inline-block;
      font-family: var(--font-mono);
      font-size: var(--fs-2xs);
      font-weight: var(--fw-medium);
      letter-spacing: var(--ls-eyebrow);
      text-transform: uppercase;
      color: var(--amber);
    }

    .wb-modal__offer {
      position: relative;
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-top: var(--space-3);
    }

    .wb-modal__pct {
      font-family: var(--font-sans);
      font-size: 64px;
      font-weight: var(--fw-black);
      line-height: .9;
      letter-spacing: var(--ls-tight);
      color: #fff;
      small { font-size: 32px; font-weight: var(--fw-bold); color: var(--amber); }
    }

    .wb-modal__pctlabel {
      font-size: var(--fs-lg);
      font-weight: var(--fw-bold);
      color: var(--navy-100);
    }

    .wb-modal__gift {
      position: absolute;
      right: var(--space-6);
      bottom: var(--space-5);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: var(--r-lg);
      background: rgba(239, 157, 16, .14);
      border: var(--bw) solid rgba(239, 157, 16, .35);
      color: var(--amber);
    }

    /* ── Cuerpo ───────────────────────────────────────────────── */
    .wb-modal__body { padding: var(--space-6); }

    .wb-modal__title {
      font-size: var(--fs-h2);
      font-weight: var(--fw-black);
      letter-spacing: var(--ls-tight);
      color: var(--ink);
      margin-bottom: var(--space-2);
    }

    .wb-modal__text {
      font-size: var(--fs-sm);
      line-height: var(--lh-relaxed);
      color: var(--ink-2);
      margin-bottom: var(--space-5);
      strong { color: var(--ink); font-weight: var(--fw-bold); }
    }

    .wb-modal__perks {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: var(--space-6);

      li {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: var(--fs-sm);
        color: var(--ink-2);
      }
      svg {
        flex-shrink: 0;
        color: var(--ok);
        background: var(--ok-bg);
        border-radius: var(--r-xs);
        padding: 2px;
        width: 20px;
        height: 20px;
      }
    }

    .wb-modal__actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .wb-modal__cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      height: 50px;
      background: var(--amber);
      color: var(--accent-ink);
      font-size: var(--fs-body);
      font-weight: var(--fw-bold);
      border-radius: var(--r);
      text-decoration: none;
      transition: background var(--t-fast), color var(--t-fast);
      &:hover { background: var(--amber-700); color: #fff; }
      svg { stroke: currentColor; }
    }

    .wb-modal__later {
      background: none;
      border: none;
      color: var(--ink-3);
      font-size: var(--fs-sm);
      font-weight: var(--fw-medium);
      padding: var(--space-1);
      cursor: pointer;
      transition: color var(--t-fast);
      &:hover { color: var(--ink); }
    }

    .wb-modal__fine {
      margin-top: var(--space-4);
      text-align: center;
      font-family: var(--font-mono);
      font-size: var(--fs-2xs);
      color: var(--ink-3);
    }

    /* ── Animaciones ──────────────────────────────────────────── */
    @keyframes wb-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes wb-pop {
      from { opacity: 0; transform: translateY(12px) scale(.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .wb-overlay, .wb-modal { animation: none; }
    }

    @media (max-width: 480px) {
      .wb-modal__pct { font-size: 52px; }
      .wb-modal__gift { width: 46px; height: 46px; }
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

  /** Cierre con tecla Escape. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dismiss();
  }

  /** Cierra solo si el clic fue sobre el backdrop, no sobre la tarjeta. */
  onBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('wb-overlay')) {
      this.dismiss();
    }
  }

  dismiss(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FLAG_KEY, '1');
    }
    this.dismissed.emit();
  }
}
