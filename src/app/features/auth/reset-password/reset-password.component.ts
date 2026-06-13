import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { FormsModule }               from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { AuthService }               from '../../../core/services/auth.service';
import { IconComponent }             from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  token       = '';
  newPassword = '';
  showPass    = false;

  loading     = false;
  error       = '';
  done        = false;   // muestra pantalla de éxito

  // true si el token no vino en la URL (enlace roto/expirado antes de intentar)
  invalidLink = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.invalidLink = true;
    }
  }

  onSubmit(): void {
    this.error = '';

    if (this.newPassword.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    this.loading = true;

    this.auth
      .confirmPasswordReset({ token: this.token, newPassword: this.newPassword })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.ok) {
            this.done = true;
            // Redirigir al login tras 2.5 s
            setTimeout(() => this.router.navigateByUrl('/login'), 2500);
          }
        },
        error: (err) => {
          this.loading = false;
          const body = err?.error;
          this.error = body?.error ?? 'El enlace no es válido o ya expiró.';
        },
      });
  }

  togglePassword(): void {
    this.showPass = !this.showPass;
  }
}
