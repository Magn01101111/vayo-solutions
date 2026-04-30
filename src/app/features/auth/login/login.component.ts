import { Component, inject } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService }    from '../../../core/services/auth.service';
import { ROLE_REDIRECTS } from '../../../core/constants/roles';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  // Form state
  email    = '';
  password = '';
  showPass = false;

  // UI state
  loading = false;
  error   = '';

  onSubmit(): void {
    this.error = '';

    if (!this.email || !this.password) {
      this.error = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.loading = true;

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.ok) {
          // La ruta de destino viene determinada por el rol del usuario.
          const target = ROLE_REDIRECTS[res.data.user.role] ?? '/admin';
          this.router.navigateByUrl(target);
        }
      },
      error: (err) => {
        this.loading = false;
        const body = err?.error;
        this.error = body?.error
          ?? 'No se pudo conectar con el servidor. Intenta más tarde.';
      },
    });
  }

  togglePassword(): void {
    this.showPass = !this.showPass;
  }
}
