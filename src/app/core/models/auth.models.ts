import type { UserRole } from '../constants/roles';

// Re-export so consumers that imported UserRole from here keep working.
export type { UserRole };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  position?: string;
  profileImage?: string;
  /** Solo presente cuando role === CLIENTE: id de su ficha CRM en `clients`. */
  clientId?: string | null;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  rut: string;          // canónico: "12345678-9"
  phone: string;        // E.164: "+56912345678"
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  redirectTo: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}
