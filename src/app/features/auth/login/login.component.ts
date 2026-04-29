import { Component, inject } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Router }         from '@angular/router';

import { AuthService }    from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  loading  = false;
  error    = '';

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
          // Rutas disponibles en este Sprint; para otras se cae a /admin
          const knownRoutes: Record<string, string> = {
            '/admin':    '/admin',
            '/catalogo': '/catalogo',
          };
          const target = knownRoutes[res.data.redirectTo] ?? '/admin';
          this.router.navigateByUrl(target);
        }
      },
      error: (err) => {
        this.loading = false;
        const body = err?.error;
        if (body?.error) {
          this.error = body.error;
        } else {
          this.error = 'No se pudo conectar con el servidor. Intenta más tarde.';
        }
      },
    });
  }

  togglePassword(): void {
    this.showPass = !this.showPass;
  }
}
