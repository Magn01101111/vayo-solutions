import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { API_CONFIG } from '../config/api.config';
import { AppNotification } from '../models/app.models';

interface NotifResponse {
  ok: boolean;
  data?: { items: AppNotification[]; unread: number };
  error?: string;
}

const POLL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private api = inject(ApiService);
  private authSvc = inject(AuthService);

  unread = signal(0);
  items = signal<AppNotification[]>([]);

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  startPolling(): void {
    if (this.pollTimer) return;
    this.refresh();
    this.pollTimer = setInterval(() => {
      if (this.authSvc.currentUser) this.refresh();
    }, POLL_MS);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.unread.set(0);
    this.items.set([]);
  }

  refresh(): void {
    this.api.get<NotifResponse>(API_CONFIG.endpoints.notifications).subscribe({
      next: (res) => {
        if (res.ok && res.data) {
          this.items.set(res.data.items);
          this.unread.set(res.data.unread);
        }
      },
      error: () => {},
    });
  }

  markRead(id: string): void {
    this.api.patch<{ ok: boolean }, {}>(`notifications/${id}/read`, {}).subscribe({
      next: () => {
        this.items.update((list) =>
          list.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        this.unread.update((n) => Math.max(0, n - 1));
      },
      error: () => {},
    });
  }

  markAllRead(): void {
    this.api.post<{ ok: boolean }, {}>(API_CONFIG.endpoints.notificationsReadAll, {}).subscribe({
      next: () => {
        this.items.update((list) => list.map((n) => ({ ...n, read: true })));
        this.unread.set(0);
      },
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
