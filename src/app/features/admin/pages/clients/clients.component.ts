import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';

import { ClientService }           from '../../../../core/services/client.service';
import { ApiClient, CreateClientPayload } from '../../../../core/models/api.models';

type FormMode = 'create' | 'edit';

interface ClientForm {
  name: string;
  company: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

function emptyForm(): ClientForm {
  return { name: '', company: '', rut: '', email: '', phone: '', address: '', notes: '' };
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

  // ── List state ────────────────────────────────────────────────────────────
  clients: ApiClient[] = [];
  loading   = true;
  searchQ   = '';
  loadError = '';

  // ── Modal state ───────────────────────────────────────────────────────────
  showModal  = false;
  formMode: FormMode = 'create';
  editingId  = '';
  form: ClientForm = emptyForm();
  saving  = false;
  formError = '';

  // ── Confirm deactivate ────────────────────────────────────────────────────
  confirmingId = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';

    const params = this.searchQ.trim()
      ? { q: this.searchQ.trim() }
      : undefined;

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

  // ── Modal ─────────────────────────────────────────────────────────────────

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
    this.form = {
      name:    client.name,
      company: client.company  ?? '',
      rut:     client.rut      ?? '',
      email:   client.email    ?? '',
      phone:   client.phone    ?? '',
      address: client.address  ?? '',
      notes:   client.notes    ?? '',
    };
    this.formError = '';
    this.showModal = true;
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

    const payload: CreateClientPayload = {
      name:    this.form.name.trim(),
      company: this.form.company.trim() || undefined,
      rut:     this.form.rut.trim()     || undefined,
      email:   this.form.email.trim()   || undefined,
      phone:   this.form.phone.trim()   || undefined,
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
      next: () => {
        this.confirmingId = '';
        this.load();
      },
      error: () => {
        this.confirmingId = '';
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  createdByName(client: ApiClient): string {
    const cb = client.createdBy;
    if (!cb) return '—';
    if (typeof cb === 'string') return cb;
    return cb.name;
  }
}
