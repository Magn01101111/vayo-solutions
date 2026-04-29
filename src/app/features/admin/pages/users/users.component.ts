import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { UserService }                   from '../../../../core/services/user.service';
import { ApiUser, CreateUserPayload }    from '../../../../core/models/api.models';

type TabType  = 'cotizadores' | 'proveedores';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly userSvc = inject(UserService);

  activeTab: TabType = 'cotizadores';

  cotizadores: ApiUser[] = [];
  proveedores: ApiUser[] = [];
  loading   = true;
  loadError = '';

  showModal  = false;
  formMode: FormMode = 'create';
  editingId  = '';
  form: UserForm = emptyForm();
  saving     = false;
  formError  = '';

  confirmingId = '';

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
        this.proveedores = all.filter((u) => u.role === 'PROVEEDOR');
        this.loading     = false;
      },
      error: () => {
        this.loadError = 'Error al cargar usuarios.';
        this.loading   = false;
      },
    });
  }

  get currentList(): ApiUser[] {
    return this.activeTab === 'cotizadores' ? this.cotizadores : this.proveedores;
  }

  setTab(tab: TabType): void {
    this.activeTab = tab;
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

    const isCotizador = this.activeTab === 'cotizadores';

    if (this.formMode === 'create') {
      const payload: CreateUserPayload = {
        name:     this.form.name.trim(),
        email:    this.form.email.trim(),
        password: this.form.password.trim(),
        phone:    this.form.phone.trim()    || undefined,
        position: this.form.position.trim() || undefined,
      };

      const obs$ = isCotizador
        ? this.userSvc.createCotizador(payload)
        : this.userSvc.createProveedor(payload);

      obs$.subscribe({
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

      const obs$ = isCotizador
        ? this.userSvc.updateCotizador(this.editingId, payload)
        : this.userSvc.updateProveedor(this.editingId, payload);

      obs$.subscribe({
        next: () => { this.saving = false; this.showModal = false; this.load(); },
        error: (err) => { this.saving = false; this.formError = err?.error?.error ?? 'Error al actualizar usuario.'; },
      });
    }
  }

  confirmDeactivate(id: string): void {
    this.confirmingId = id;
  }

  cancelDeactivate(): void {
    this.confirmingId = '';
  }

  deactivate(id: string): void {
    const isCotizador = this.activeTab === 'cotizadores';
    const obs$ = isCotizador
      ? this.userSvc.deactivateCotizador(id)
      : this.userSvc.deactivateProveedor(id);

    obs$.subscribe({
      next: () => { this.confirmingId = ''; this.load(); },
      error: () => { this.confirmingId = ''; },
    });
  }
}
