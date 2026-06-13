import { Component, inject } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService }    from '../../../core/services/auth.service';
import { ROLE_REDIRECTS } from '../../../core/constants/roles';
import {
  validateRut,
  formatRutInput,
  normalizeChileanPhone,
  onlyDigits,
} from '../../../core/utils/validators';
import { IconComponent }  from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  // Form state
  name        = '';
  email       = '';
  password    = '';
  rut         = '';   // formateado para mostrar al usuario "12.345.678-9"
  phoneDigits = '';   // solo los 8 dígitos que tipea el usuario
  showPass    = false;

  // UI state
  loading = false;
  error   = '';

  // ── Handlers de input con auto-formateo ─────────────────────────────────────

  onRutInput(value: string): void {
    this.rut = formatRutInput(value);
  }

  onPhoneInput(value: string): void {
    this.phoneDigits = onlyDigits(value, 8);
  }

  togglePassword(): void {
    this.showPass = !this.showPass;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

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

    // ── Validar RUT (algoritmo módulo 11 + dígito verificador) ───────────────
    const canonicalRut = validateRut(this.rut);
    if (!canonicalRut) {
      this.error = 'RUT inválido. Verifica el dígito verificador.';
      return;
    }

    // ── Validar teléfono ─────────────────────────────────────────────────────
    if (this.phoneDigits.length !== 8) {
      this.error = 'El teléfono debe tener 8 dígitos.';
      return;
    }
    const canonicalPhone = normalizeChileanPhone(this.phoneDigits);
    if (!canonicalPhone) {
      this.error = 'Teléfono inválido.';
      return;
    }

    this.loading = true;

    this.auth
      .register({
        name:     this.name.trim(),
        email:    this.email.trim().toLowerCase(),
        password: this.password,
        rut:      canonicalRut,
        phone:    canonicalPhone,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.ok) {
            const target = ROLE_REDIRECTS[res.data.user.role] ?? '/';
            this.router.navigateByUrl(target);
          }
        },
        error: (err) => {
          this.loading = false;
          const body = err?.error;
          this.error = body?.error ?? 'No se pudo completar el registro. Intenta más tarde.';
        },
      });
  }
}
