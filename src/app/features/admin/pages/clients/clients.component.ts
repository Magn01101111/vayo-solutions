import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { Router }        from '@angular/router';

import { ClientService }                   from '../../../../core/services/client.service';
import { ApiClient, CreateClientPayload }  from '../../../../core/models/api.models';
import {
  formatRut,
  formatRutInput,
  formatPhone,
  onlyDigits,
} from '../../../../core/utils/validators';

type FormMode = 'create' | 'edit';

interface ClientForm {
  name: string;
  company: string;
  rut: string;          // formateado mientras se tipea: "12.345.678-9"
  email: string;
  phoneDigits: string;  // solo los 8 dígitos (sin prefijo)
  address: string;
  notes: string;
}

function emptyForm(): ClientForm {
  return { name: '', company: '', rut: '', email: '', phoneDigits: '', address: '', notes: '' };
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
})
export class ClientsComponent implements OnInit {
  private readonly clientSvc = inject(ClientService);
  private readonly router    = inject(Router);

  /** Navega a /admin/cotizaciones?clientId=... para ver el historial */
  viewQuoteHistory(clientId: string): void {
    this.router.navigate(['/admin/cotizaciones'], { queryParams: { clientId } });
  }

  // ── List state ────────────────────────────────────────────────────────────
  clients: ApiClient[] = [];
  loading   = true;
  searchQ   = '';
  loadError = '';

  // ── Modal create/edit ─────────────────────────────────────────────────────
  showModal  = false;
  formMode: FormMode = 'create';
  editingId  = '';
  form: ClientForm = emptyForm();
  saving  = false;
  formError = '';

  // ── Confirm deactivate ────────────────────────────────────────────────────
  confirmingId = '';

  // ── Modal invitar al portal ───────────────────────────────────────────────
  showInviteModal = false;
  invitingClient: ApiClient | null = null;
  invitePassword  = '';
  inviting        = false;
  inviteError     = '';

  // ── Confirm revoke portal ─────────────────────────────────────────────────
  revokingId = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';

    // active: 'all' → el panel admin ve también los clientes inactivos
    // (si no, al desactivar uno desaparecería y no se podría reactivar).
    const params: { q?: string; active: 'all' } = { active: 'all' };
    if (this.searchQ.trim()) params.q = this.searchQ.trim();

    this.clientSvc.getClients(params).subscribe({
      next: (res) => {
        this.clients = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Error al cargar clientes.';
        this.loading   = false;
      },
    });
  }

  onSearch(): void {
    this.load();
  }

  clearSearch(): void {
    this.searchQ = '';
    this.load();
  }

  // ── Modal CRUD ────────────────────────────────────────────────────────────

  openCreate(): void {
    this.formMode  = 'create';
    this.editingId = '';
    this.form      = emptyForm();
    this.formError = '';
    this.showModal = true;
  }

  openEdit(client: ApiClient): void {
    this.formMode  = 'edit';
    this.editingId = client.id;
    // El backend nos da RUT canónico ("12345678-9") y teléfono E.164 ("+56912345678").
    // Lo convertimos al formato de display para que el usuario lo edite cómodo.
    this.form = {
      name:        client.name,
      company:     client.company  ?? '',
      rut:         client.rut ? formatRut(client.rut) : '',
      email:       client.email    ?? '',
      phoneDigits: client.phone ? client.phone.replace(/^\+569/, '') : '',
      address:     client.address  ?? '',
      notes:       client.notes    ?? '',
    };
    this.formError = '';
    this.showModal = true;
  }

  // ── Handlers de input con auto-formateo ───────────────────────────────────

  onRutInput(value: string): void {
    this.form.rut = formatRutInput(value);
  }

  onPhoneInput(value: string): void {
    this.form.phoneDigits = onlyDigits(value, 8);
  }

  closeModal(): void {
    this.showModal = false;
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.formError = 'El nombre del cliente es obligatorio.';
      return;
    }

    this.saving    = true;
    this.formError = '';

    // Construir el payload — el backend valida y normaliza RUT y teléfono.
    // Le mandamos lo que tenemos; si hay error vuelve un 400 con mensaje claro.
    const payload: CreateClientPayload = {
      name:    this.form.name.trim(),
      company: this.form.company.trim() || undefined,
      rut:     this.form.rut.trim()     || undefined,
      email:   this.form.email.trim()   || undefined,
      // Mandamos los 8 dígitos; el backend lo normaliza a +56912345678
      phone:   this.form.phoneDigits || undefined,
      address: this.form.address.trim() || undefined,
      notes:   this.form.notes.trim()   || undefined,
    };

    const obs$ = this.formMode === 'create'
      ? this.clientSvc.createClient(payload)
      : this.clientSvc.updateClient(this.editingId, payload);

    obs$.subscribe({
      next: () => {
        this.saving    = false;
        this.showModal = false;
        this.load();
      },
      error: (err) => {
        this.saving    = false;
        this.formError = err?.error?.error ?? 'Error al guardar el cliente.';
      },
    });
  }

  // ── Deactivate ────────────────────────────────────────────────────────────

  confirmDeactivate(id: string): void {
    this.confirmingId = id;
  }

  cancelDeactivate(): void {
    this.confirmingId = '';
  }

  deactivate(id: string): void {
    this.clientSvc.deactivateClient(id).subscribe({
      next: () => { this.confirmingId = ''; this.load(); },
      error: () => { this.confirmingId = ''; },
    });
  }

  /** Reactiva un cliente inactivo (update con isActive=true). */
  reactivate(client: ApiClient): void {
    this.clientSvc.updateClient(client.id, { isActive: true }).subscribe({
      next: () => this.load(),
    });
  }

  // ── Invitar al portal ─────────────────────────────────────────────────────

  openInvite(client: ApiClient): void {
    this.invitingClient = client;
    this.invitePassword = '';
    this.inviteError    = '';
    this.showInviteModal = true;
  }

  closeInvite(): void {
    this.showInviteModal = false;
    this.invitingClient  = null;
  }

  sendInvite(): void {
    if (!this.invitingClient) return;

    if (this.invitePassword.length < 8) {
      this.inviteError = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    this.inviting    = true;
    this.inviteError = '';

    this.clientSvc
      .inviteToPortal(this.invitingClient.id, { password: this.invitePassword })
      .subscribe({
        next: () => {
          this.inviting        = false;
          this.showInviteModal = false;
          this.invitingClient  = null;
          this.load();
        },
        error: (err) => {
          this.inviting    = false;
          this.inviteError = err?.error?.error ?? 'Error al crear cuenta de portal.';
        },
      });
  }

  // ── Revocar portal ────────────────────────────────────────────────────────

  confirmRevoke(id: string): void {
    this.revokingId = id;
  }

  cancelRevoke(): void {
    this.revokingId = '';
  }

  revokePortal(id: string): void {
    this.clientSvc.revokePortalAccess(id).subscribe({
      next: () => { this.revokingId = ''; this.load(); },
      error: () => { this.revokingId = ''; },
    });
  }

  // ── Helpers de display ────────────────────────────────────────────────────

  /** Formatea el RUT canónico para mostrarlo: "12345678-9" → "12.345.678-9" */
  displayRut(rut: string | null | undefined): string {
    return rut ? formatRut(rut) : '—';
  }

  /** Formatea el teléfono E.164 para mostrarlo: "+56912345678" → "+56 9 1234 5678" */
  displayPhone(phone: string | null | undefined): string {
    return phone ? formatPhone(phone) : '—';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  createdByName(client: ApiClient): string {
    const cb = client.createdBy;
    if (!cb) return 'Auto-registro';
    if (typeof cb === 'string') return cb;
    return cb.name;
  }

  canInvite(client: ApiClient): boolean {
    return client.isActive
        && !client.hasPortalAccount
        && !!client.email;
  }
}
