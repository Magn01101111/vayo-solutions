import { Component, inject } from '@angular/core';
import { CommonModule }  from '@angular/common';

import { AuthService }   from '../../../../core/services/auth.service';
import { ROLE_LABELS }   from '../../../../core/constants/roles';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss',
})
export class AdminTopbarComponent {
  readonly auth = inject(AuthService);

  get user() {
    return this.auth.currentUser;
  }

  get roleLabel(): string {
    const role = this.user?.role;
    return role ? (ROLE_LABELS[role] ?? '') : '';
  }

  logout(): void {
    this.auth.logout();
  }
}
