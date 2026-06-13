import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterLink }      from '@angular/router';

import { AuthService }          from '../../../../core/services/auth.service';
import { QuotationService }     from '../../../../core/services/quotation.service';
import { CompanyService }       from '../../../../core/services/company.service';
import { CartDropdownComponent } from '../cart-dropdown/cart-dropdown.component';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [CommonModule, RouterLink, CartDropdownComponent],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
})
export class PublicHeaderComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly qs   = inject(QuotationService);
  private readonly companySvc = inject(CompanyService);

  logoUrl = signal<string | null>(null);
  companyName = signal<string>('VAYO Solutions');

  /** Controla la visibilidad del dropdown de usuario */
  userMenuOpen = false;
  /** Controla el menú móvil (hamburguesa) */
  mobileMenuOpen = false;

  ngOnInit(): void {
    this.companySvc.getPublicCompany().subscribe({
      next: (res) => {
        if (res.ok && res.data) {
          if (res.data.logoUrl) this.logoUrl.set(res.data.logoUrl);
          if (res.data.name)    this.companyName.set(res.data.name);
        }
      },
      error: () => { /* silencioso — el fallback es el texto */ },
    });
  }

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
