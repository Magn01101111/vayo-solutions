import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { SupplierService } from '../../../../core/services/supplier.service';
import { ApiSupplier, SupplierPayload } from '../../../../core/models/api.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { VayoModalComponent } from '../../../../shared/components/vayo-modal/vayo-modal.component';

type FormMode = 'create' | 'edit';

interface SupplierForm {
  name: string;
  location: string;
  email: string;
  phone: string;
  notes: string;
}

function emptyForm(): SupplierForm {
  return { name: '', location: '', email: '', phone: '', notes: '' };
}

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, VayoModalComponent],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
})
export class SuppliersComponent implements OnInit {
  private readonly supplierSvc = inject(SupplierService);

  suppliers: ApiSupplier[] = [];
  loading   = true;
  loadError = '';

  showModal  = false;
  formMode: FormMode = 'create';
  editingId  = '';
  form: SupplierForm = emptyForm();
  saving     = false;
  formError  = '';

  confirmingId = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';
    this.supplierSvc.getSuppliers(true).subscribe({
      next: (res) => { this.suppliers = res.data ?? []; this.loading = false; },
      error: () => { this.loadError = 'Error al cargar proveedores.'; this.loading = false; },
    });
  }

  openCreate(): void {
    this.formMode = 'create';
    this.editingId = '';
    this.form = emptyForm();
    this.formError = '';
    this.showModal = true;
  }

  openEdit(s: ApiSupplier): void {
    this.formMode = 'edit';
    this.editingId = s.id;
    this.form = {
      name: s.name,
      location: s.location ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      notes: s.notes ?? '',
    };
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.formError = 'El nombre es obligatorio.';
      return;
    }
    this.saving = true;
    this.formError = '';

    const payload: SupplierPayload = {
      name: this.form.name.trim(),
      location: this.form.location.trim() || undefined,
      email: this.form.email.trim() || undefined,
      phone: this.form.phone.trim() || undefined,
      notes: this.form.notes.trim() || undefined,
    };

    const obs$ = this.formMode === 'create'
      ? this.supplierSvc.createSupplier(payload)
      : this.supplierSvc.updateSupplier(this.editingId, payload);

    obs$.subscribe({
      next: () => { this.saving = false; this.showModal = false; this.load(); },
      error: (err) => { this.saving = false; this.formError = err?.error?.error ?? 'Error al guardar.'; },
    });
  }

  confirmDeactivate(id: string): void { this.confirmingId = id; }
  cancelDeactivate(): void { this.confirmingId = ''; }

  deactivate(id: string): void {
    this.supplierSvc.deactivateSupplier(id).subscribe({
      next: () => { this.confirmingId = ''; this.load(); },
      error: () => { this.confirmingId = ''; },
    });
  }

  reactivate(s: ApiSupplier): void {
    this.supplierSvc.updateSupplier(s.id, { isActive: true }).subscribe({
      next: () => this.load(),
    });
  }
}
