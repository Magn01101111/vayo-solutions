import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { ReviewService } from '../../../../core/services/review.service';
import { ApiReview, ApiReviewStatus } from '../../../../core/models/api.models';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
})
export class ReviewsComponent implements OnInit {
  private readonly reviewSvc = inject(ReviewService);

  reviews: ApiReview[] = [];
  loading   = true;
  loadError = '';

  statusFilter: '' | ApiReviewStatus = '';
  updatingId = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.reviewSvc.getAllReviews(this.statusFilter || undefined).subscribe({
      next: (res) => { this.reviews = res.data ?? []; this.loading = false; },
      error: () => { this.loadError = 'Error al cargar reseñas.'; this.loading = false; },
    });
  }

  moderate(r: ApiReview, status: ApiReviewStatus): void {
    if (r.status === status) return;
    this.updatingId = r.id;
    this.reviewSvc.moderate(r.id, status).subscribe({
      next: (res) => {
        const idx = this.reviews.findIndex((x) => x.id === r.id);
        if (idx >= 0) this.reviews[idx] = res.data;
        this.updatingId = '';
        // Si hay filtro activo y la reseña ya no califica, recargar
        if (this.statusFilter && res.data.status !== this.statusFilter) this.load();
      },
      error: () => { this.updatingId = ''; },
    });
  }

  remove(r: ApiReview): void {
    if (!confirm('¿Eliminar esta reseña permanentemente?')) return;
    this.reviewSvc.remove(r.id).subscribe({
      next: () => { this.reviews = this.reviews.filter((x) => x.id !== r.id); },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };
    return map[s] ?? s;
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
    return map[s] ?? '';
  }
}
