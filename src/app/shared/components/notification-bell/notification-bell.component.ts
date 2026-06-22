import { Component, OnDestroy, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/app.models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nb" [class.nb--open]="open">
      <button
        type="button"
        class="nb__trigger"
        aria-label="Notificaciones"
        [attr.aria-expanded]="open"
        (click)="toggle()"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        @if (notifSvc.unread() > 0) {
          <span class="nb__badge">{{ notifSvc.unread() > 9 ? '9+' : notifSvc.unread() }}</span>
        }
      </button>

      @if (open) {
        <div class="nb__panel" role="menu">
          <div class="nb__head">
            <span class="nb__head-title">Notificaciones</span>
            @if (notifSvc.unread() > 0) {
              <button type="button" class="nb__mark-all" (click)="markAll()">
                Marcar todas como leídas
              </button>
            }
          </div>

          @if (notifSvc.items().length === 0) {
            <p class="nb__empty">Sin notificaciones</p>
          } @else {
            <ul class="nb__list" role="list">
              @for (n of notifSvc.items(); track n.id) {
                <li
                  class="nb__item"
                  [class.nb__item--unread]="!n.read"
                  role="menuitem"
                  (click)="openNotif(n)"
                >
                  <span class="nb__item-dot" aria-hidden="true"></span>
                  <div class="nb__item-body">
                    <p class="nb__item-title">{{ n.title }}</p>
                    @if (n.body) { <p class="nb__item-body-txt">{{ n.body }}</p> }
                    <p class="nb__item-time">{{ formatDate(n.createdAt) }}</p>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .nb { position: relative; }

    .nb__trigger {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px; height: 36px;
      background: none;
      border: var(--bw) solid var(--line);
      border-radius: var(--r-xs);
      color: var(--ink-2);
      cursor: pointer;
      transition: color var(--t-fast), background var(--t-fast);

      &:hover { background: var(--paper-2); color: var(--ink); }
    }

    .nb__badge {
      position: absolute;
      top: -5px; right: -5px;
      min-width: 17px; height: 17px;
      padding: 0 4px;
      background: var(--danger);
      color: #fff;
      font-size: 10px;
      font-weight: var(--fw-bold);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .nb__panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 320px;
      background: var(--paper);
      border: var(--bw) solid var(--line);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-lg);
      z-index: 400;
      overflow: hidden;
      animation: nb-pop var(--t-base);
    }
    @keyframes nb-pop {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .nb__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      border-bottom: var(--bw) solid var(--line-2);
      background: var(--paper-2);
    }

    .nb__head-title {
      font-size: var(--fs-xs);
      font-weight: var(--fw-bold);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--ink-2);
    }

    .nb__mark-all {
      background: none;
      border: none;
      font-size: var(--fs-xs);
      color: var(--blue);
      cursor: pointer;
      padding: 0;
      &:hover { text-decoration: underline; }
    }

    .nb__empty {
      padding: var(--space-5) var(--space-4);
      text-align: center;
      font-size: var(--fs-sm);
      color: var(--ink-2);
    }

    .nb__list {
      list-style: none;
      padding: 0; margin: 0;
      max-height: 360px;
      overflow-y: auto;
    }

    .nb__item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      cursor: pointer;
      transition: background var(--t-fast);
      border-bottom: var(--bw) solid var(--line-2);

      &:last-child { border-bottom: none; }
      &:hover { background: var(--paper-2); }

      &--unread {
        background: color-mix(in srgb, var(--blue) 4%, transparent);
        .nb__item-dot { background: var(--blue); }
      }
    }

    .nb__item-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: transparent;
      border: 1.5px solid var(--line);
      flex-shrink: 0;
      margin-top: 5px;
    }

    .nb__item-body { min-width: 0; }

    .nb__item-title {
      font-size: var(--fs-sm);
      font-weight: var(--fw-semibold);
      color: var(--ink);
      margin: 0;
    }

    .nb__item-body-txt {
      font-size: var(--fs-xs);
      color: var(--ink-2);
      margin: 2px 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nb__item-time {
      font-size: var(--fs-xs);
      color: var(--ink-3, var(--ink-2));
      margin: 3px 0 0;
    }

    @media (max-width: 480px) {
      .nb__panel { width: 290px; right: -8px; }
    }
  `],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly notifSvc = inject(NotificationService);
  private readonly router = inject(Router);

  open = false;

  ngOnInit(): void {
    this.notifSvc.startPolling();
  }

  ngOnDestroy(): void {
    this.notifSvc.stopPolling();
  }

  toggle(): void {
    this.open = !this.open;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.nb')) this.open = false;
  }

  openNotif(n: AppNotification): void {
    if (!n.read) this.notifSvc.markRead(n.id);
    this.open = false;
    if (n.link) this.router.navigateByUrl(n.link);
  }

  markAll(): void {
    this.notifSvc.markAllRead();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es-CL', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  }
}
