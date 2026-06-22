import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { UserService }                 from '../../../../core/services/user.service';
import { ApiUser, CreateUserPayload }  from '../../../../core/models/api.models';
import { IconComponent }               from '../../../../shared/components/icon/icon.component';
import { VayoModalComponent }          from '../../../../shared/components/vayo-modal/vayo-modal.component';
import { ActionFeedbackService }       from '../../../../core/services/action-feedback.service';

/**
 * Gestiona el personal interno de VAYO con acceso al panel: COTIZADORES.
 *
 * Notas de diseño:
 *  - Los CLIENTES (rol CLIENTE) se gestionan en /admin/clientes (entidad CRM).
 *  - Los PROVEEDORES de catálogo (empresas con tiempo de entrega) se gestionan
 *    en /admin/proveedores (entidad Supplier). NO son usuarios con login.
 */
type FormMode = 'create' | 'edit';

interface UserForm {
  name:     string;
  email:    string;
  password: string;
  phone:    string;
  position: string;
}

function emptyForm(): UserForm {
  return { name: '', email: '', password: '', phone: '', position: '' };
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, VayoModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly userSvc  = inject(UserService);
  private readonly feedback = inject(ActionFeedbackService);

  cotizadores: ApiUser[] = [];
  loading   = true;
  loadError = '';

  showModal  = false;
  formMode: FormMode = 'create';
  editingId  = '';
  form: UserForm = emptyForm();
  saving     = false;
  formError  = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';

    this.userSvc.getUsers().subscribe({
      next: (res) => {
        const all = res.data ?? [];
        this.cotizadores = all.filter((u) => u.role === 'COTIZADOR');
        this.loading     = false;
      },
      error: () => {
        this.loadError = 'Error al cargar usuarios.';
        this.loading   = false;
      },
    });
  }

  openCreate(): void {
    this.formMode  = 'create';
    this.editingId = '';
    this.form      = emptyForm();
    this.formError = '';
    this.showModal = true;
  }

  openEdit(user: ApiUser): void {
    this.formMode  = 'edit';
    this.editingId = user.id;
    this.form = {
      name:     user.name,
      email:    user.email,
      password: '',
      phone:    user.phone     ?? '',
      position: user.position  ?? '',
    };
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  save(): void {
    if (!this.form.name.trim() || !this.form.email.trim()) {
      this.formError = 'Nombre y correo son obligatorios.';
      return;
    }

    if (this.formMode === 'create' && !this.form.password.trim()) {
      this.formError = 'La contraseña es obligatoria al crear un usuario.';
      return;
    }

    this.saving    = true;
    this.formError = '';

    if (this.formMode === 'create') {
      const payload: CreateUserPayload = {
        name:     this.form.name.trim(),
        email:    this.form.email.trim(),
        password: this.form.password.trim(),
        phone:    this.form.phone.trim()    || undefined,
        position: this.form.position.trim() || undefined,
      };

      this.userSvc.createCotizador(payload).subscribe({
        next: () => { this.saving = false; this.showModal = false; this.load(); },
        error: (err) => { this.saving = false; this.formError = err?.error?.error ?? 'Error al crear usuario.'; },
      });

    } else {
      const payload = {
        name:     this.form.name.trim()     || undefined,
        email:    this.form.email.trim()    || undefined,
        phone:    this.form.phone.trim()    || undefined,
        position: this.form.position.trim() || undefined,
      };

      this.userSvc.updateCotizador(this.editingId, payload).subscribe({
        next: () => { this.saving = false; this.showModal = false; this.load(); },
        error: (err) => { this.saving = false; this.formError = err?.error?.error ?? 'Error al actualizar usuario.'; },
      });
    }
  }

  confirmDeactivate(id: string): void {
    const user = this.cotizadores.find((u) => u.id === id);
    this.feedback.run({
      confirm: {
        title: 'Desactivar cotizador',
        message: `${user?.name ?? 'Este usuario'} perderá el acceso al panel. Podrás reactivarlo cuando quieras.`,
        confirmLabel: 'Desactivar',
        tone: 'danger',
      },
      action: () => this.userSvc.deactivateCotizador(id).toPromise(),
      outcome: () => ({
        title: 'Cotizador desactivado',
        message: `${user?.name ?? 'El usuario'} ya no tiene acceso al panel.`,
        tone: 'success',
        actions: [{ label: 'Aceptar', dismiss: true }],
      }),
      onError: () => ({
        title: 'Error al desactivar',
        message: 'No se pudo desactivar el usuario.',
        tone: 'danger',
        actions: [{ label: 'Cerrar', dismiss: true }],
      }),
    }).then(() => this.load());
  }

  deactivate(id: string): void {
    this.userSvc.deactivateCotizador(id).subscribe({
      next: () => { this.load(); },
      error: () => {},
    });
  }

  /** Reactiva un cotizador inactivo (update con isActive=true). */
  reactivate(user: ApiUser): void {
    this.userSvc.updateCotizador(user.id, { isActive: true }).subscribe({
      next: () => this.load(),
    });
  }
}
