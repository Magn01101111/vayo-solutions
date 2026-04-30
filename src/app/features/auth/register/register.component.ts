import { Component, inject } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService }    from '../../../core/services/auth.service';
import { ROLE_REDIRECTS } from '../../../core/constants/roles';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  // Form state
  name     = '';
  email    = '';
  password = '';
  phone    = '';
  showPass = false;

  // UI state
  loading = false;
  error   = '';

  onSubmit(): void {
    this.error = '';

    if (!this.name.trim() || !this.email || !this.password) {
      this.error = 'Completa los campos obligatorios.';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    this.loading = true;
    console.log('[Register] Enviando registro...');

    this.auth
      .register({
        name: this.name.trim(),
        email: this.email,
        password: this.password,
        phone: this.phone.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          console.log('[Register] Respuesta OK:', res);
          this.loading = false;
          if (res.ok) {
            const target = ROLE_REDIRECTS[res.data.user.role] ?? '/';
            this.router.navigateByUrl(target);
          }
        },
        error: (err) => {
          console.error('[Register] Error:', err.status, err.error);
          this.loading = false;
          const body = err?.error;
          this.error = body?.error ?? 'No se pudo completar el registro. Intenta más tarde.';
        },
      });
  }

  togglePassword(): void {
    this.showPass = !this.showPass;
  }
}
