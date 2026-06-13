import { Component, inject } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService }    from '../../../core/services/auth.service';
import { ROLE_REDIRECTS } from '../../../core/constants/roles';
import { IconComponent }  from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Ingresa un correo electrónico válido.';
      return;
    }

    this.loading = true;

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.ok) {
          // Si llegamos aquí por una sesión expirada, volvemos a donde estaba el
          // usuario (?redirect=). Solo se acepta una ruta interna (anti open-redirect).
          const redirect = this.route.snapshot.queryParamMap.get('redirect');
          const safeRedirect =
            redirect && redirect.startsWith('/') && !redirect.startsWith('//')
              ? redirect
              : null;
          const target = safeRedirect ?? ROLE_REDIRECTS[res.data.user.role] ?? '/admin';
          this.router.navigateByUrl(target);
        }
      },
      error: (err) => {
        this.loading = false;
        const body = err?.error;
        let msg = body?.error ?? 'No se pudo conectar con el servidor. Intenta más tarde.';
        if (body?.attemptsLeft != null && body.attemptsLeft > 0) {
          msg += ` (${body.attemptsLeft} intento${body.attemptsLeft === 1 ? '' : 's'} restante${body.attemptsLeft === 1 ? '' : 's'})`;
        }
        this.error = msg;
      },
    });
  }

  togglePassword(): void {
    this.showPass = !this.showPass;
  }
}
