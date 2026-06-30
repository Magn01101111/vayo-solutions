import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

type PayStatus = 'ok' | 'rejected' | 'cancelled' | 'error';

/**
 * Página de resultado del pago Webpay.
 * Webpay devuelve el control al backend (commit), que luego redirige el navegador
 * aquí con ?status=ok|rejected|cancelled|error y datos extra (folio, auth, code).
 *
 * Ruta de nivel superior (fuera del shell público) para que funcione con cualquier
 * rol — incluido ADMIN, que el publicShellGuard expulsaría del portal.
 */
@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-result.component.html',
  styleUrl: './payment-result.component.scss',
})
export class PaymentResultComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth   = inject(AuthService);

  status = signal<PayStatus>('error');
  folio  = signal<string>('');
  auth$  = signal<string>('');
  code   = signal<string>('');
  msg    = signal<string>('');

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const s = (q.get('status') as PayStatus) ?? 'error';
    this.status.set(['ok', 'rejected', 'cancelled', 'error'].includes(s) ? s : 'error');
    this.folio.set(q.get('folio') ?? '');
    this.auth$.set(q.get('auth') ?? '');
    this.code.set(q.get('code') ?? '');
    this.msg.set(q.get('msg') ?? '');
  }

  /** Destino del botón principal según dónde pueda ir el usuario. */
  primaryAction(): void {
    const role = this.auth.currentUser?.role;
    if (role === 'ADMIN' || role === 'COTIZADOR' || role === 'PROVEEDOR') {
      this.router.navigate(['/admin/ventas']);
    } else if (role === 'CLIENTE') {
      this.router.navigate(['/portal-cliente']);
    } else {
      this.router.navigate(['/']);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  // ── Textos según estado ───────────────────────────────────────────────────────

  title(): string {
    return {
      ok:        '¡Pago exitoso!',
      rejected:  'Pago rechazado',
      cancelled: 'Pago cancelado',
      error:     'No pudimos procesar el pago',
    }[this.status()];
  }

  message(): string {
    switch (this.status()) {
      case 'ok':
        return 'Tu pago fue autorizado correctamente. La venta quedó marcada como pagada.';
      case 'rejected':
        return 'El banco rechazó la transacción. No se realizó ningún cargo. Puedes intentar con otra tarjeta.';
      case 'cancelled':
        return 'Cancelaste el pago antes de completarlo. No se realizó ningún cargo.';
      default:
        return this.msg() === 'amount_mismatch'
          ? 'El monto de la transacción no coincide con el de la venta. No se confirmó el pago.'
          : 'Ocurrió un problema al confirmar el pago. Si crees que se realizó un cargo, contáctanos.';
    }
  }

  primaryLabel(): string {
    const role = this.auth.currentUser?.role;
    if (role === 'CLIENTE') return 'Ir a mis compras';
    if (role) return 'Ir a ventas';
    return 'Volver al inicio';
  }
}
