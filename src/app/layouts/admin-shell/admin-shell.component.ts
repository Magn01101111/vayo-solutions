import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../../shared/components/admin/admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../../shared/components/admin/admin-topbar/admin-topbar.component';
import { VayoConfirmComponent } from '../../shared/components/vayo-confirm/vayo-confirm.component';
import { VayoActionResultComponent } from '../../shared/components/vayo-action-result/vayo-action-result.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, AdminTopbarComponent, VayoConfirmComponent, VayoActionResultComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {}
