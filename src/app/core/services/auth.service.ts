import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { ApiService }     from './api.service';
import { StorageService } from './storage.service';
import { API_CONFIG }     from '../config/api.config';
import type { UserRole }  from '../constants/roles';
import { ApiResponse }    from '../models/api.models';
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ChangePasswordRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
} from '../models/auth.models';

const TOKEN_KEY = 'vayo_token';
const USER_KEY  = 'vayo_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api     = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly router  = inject(Router);

  private readonly _user$ = new BehaviorSubject<AuthUser | null>(this.loadUser());

  /** Stream reactivo del usuario autenticado. */
  readonly user$: Observable<AuthUser | null> = this._user$.asObservable();

  // ── Consultas sincrónicas ──────────────────────────────────────────────────

  get currentUser(): AuthUser | null {
    return this._user$.value;
  }

  get token(): string | null {
    return this.storage.getItem(TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  /** Devuelve true si el usuario tiene al menos uno de los roles indicados. */
  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser;
    return !!user && roles.includes(user.role);
  }

  // ── Autenticación ─────────────────────────────────────────────────────────

  register(payload: RegisterRequest): Observable<ApiResponse<LoginResponse>> {
    return this.api
      .post<ApiResponse<LoginResponse>, RegisterRequest>(
        API_CONFIG.endpoints.register,
        payload,
      )
      .pipe(
        tap((res) => {
          if (res.ok) {
            this.persist(res.data.token, res.data.user);
          }
        }),
      );
  }

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.api
      .post<ApiResponse<LoginResponse>, LoginRequest>(
        API_CONFIG.endpoints.login,
        credentials,
      )
      .pipe(
        tap((res) => {
          if (res.ok) {
            this.persist(res.data.token, res.data.user);
          }
        }),
      );
  }

  logout(): void {
    // Llamada al backend (best-effort — JWT es stateless)
    this.api
      .post<unknown, Record<string, never>>(API_CONFIG.endpoints.logout, {})
      .subscribe({ error: () => { /* ignorar */ } });

    this.clear();
    this.router.navigate(['/login']);
  }

  // ── Perfil ────────────────────────────────────────────────────────────────

  getProfile(): Observable<ApiResponse<AuthUser>> {
    return this.api.get<ApiResponse<AuthUser>>(API_CONFIG.endpoints.me).pipe(
      tap((res) => {
        if (res.ok && this.token) {
          this.updateUser(res.data);
        }
      }),
    );
  }

  // ── Contraseña ────────────────────────────────────────────────────────────

  changePassword(
    payload: ChangePasswordRequest,
  ): Observable<ApiResponse<{ message: string }>> {
    return this.api.put<ApiResponse<{ message: string }>, ChangePasswordRequest>(
      API_CONFIG.endpoints.changePassword,
      payload,
    );
  }

  requestPasswordReset(
    payload: PasswordResetRequest,
  ): Observable<ApiResponse<{ message: string }>> {
    return this.api.post<ApiResponse<{ message: string }>, PasswordResetRequest>(
      API_CONFIG.endpoints.passwordResetRequest,
      payload,
    );
  }

  confirmPasswordReset(
    payload: PasswordResetConfirm,
  ): Observable<ApiResponse<{ message: string }>> {
    return this.api.post<
      ApiResponse<{ message: string }>,
      PasswordResetConfirm
    >(API_CONFIG.endpoints.passwordResetConfirm, payload);
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  private persist(token: string, user: AuthUser): void {
    this.storage.setItem(TOKEN_KEY, token);
    this.storage.setItem(USER_KEY, JSON.stringify(user));
    this._user$.next(user);
  }

  private updateUser(user: AuthUser): void {
    this.storage.setItem(USER_KEY, JSON.stringify(user));
    this._user$.next(user);
  }

  private clear(): void {
    this.storage.removeItem(TOKEN_KEY);
    this.storage.removeItem(USER_KEY);
    this._user$.next(null);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = this.storage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
