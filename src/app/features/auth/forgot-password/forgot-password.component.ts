import { Component, inject } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterLink }        from '@angular/router';

import { AuthService }       from '../../../core/services/auth.service';
import { IconComponent }     from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);

  email   = '';
  loading = false;
  error   = '';
  sent    = false;   // muestra pantalla de éxito

  onSubmit(): void {
    this.error = '';

    if (!this.email) {
      this.error = 'Ingresa tu correo electrónico.';
      return;
    }

    this.loading = true;

    this.auth.requestPasswordReset({ email: this.email }).subscribe({
      next: () => {
        // El backend siempre devuelve 200 aunque el email no exista (seguridad)
        this.loading = false;
        this.sent = true;
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo enviar el correo. Intenta más tarde.';
      },
    });
  }
}
