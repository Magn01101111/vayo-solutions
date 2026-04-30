import { Component, HostListener, inject } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterLink }      from '@angular/router';

import { AuthService }          from '../../../../core/services/auth.service';
import { QuotationService }     from '../../../../core/services/quotation.service';
import { CartDropdownComponent } from '../cart-dropdown/cart-dropdown.component';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [CommonModule, RouterLink, CartDropdownComponent],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
})
export class PublicHeaderComponent {
  readonly auth = inject(AuthService);
  readonly qs   = inject(QuotationService);

  /** Controla la visibilidad del dropdown de usuario */
  userMenuOpen = false;

  get user() {
    return this.auth.currentUser;
  }

  /** Iniciales del nombre para el avatar (máx. 2 letras) */
  get initials(): string {
    const name = this.user?.name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  logout(): void {
    this.userMenuOpen = false;
    this.auth.logout();
  }

  /** Cierra el dropdown al hacer click fuera de él */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.ph-user-menu')) {
      this.userMenuOpen = false;
    }
  }
}
