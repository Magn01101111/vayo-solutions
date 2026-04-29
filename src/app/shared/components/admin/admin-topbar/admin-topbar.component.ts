import { Component, inject } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { AuthService }    from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss',
})
export class AdminTopbarComponent {
  readonly auth = inject(AuthService);

  get user() {
    return this.auth.currentUser;
  }

  get roleLabel(): string {
    const labels: Record<string, string> = {
      ADMIN:      'Administrador',
      COTIZADOR:  'Cotizador',
      PROVEEDOR:  'Proveedor',
      CLIENTE:    'Cliente',
    };
    return labels[this.user?.role ?? ''] ?? '';
  }

  logout(): void {
    this.auth.logout();
  }
}
