import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { CatalogService }         from '../../../../core/services/catalog.service';
import { ApiCategory }            from '../../../../core/models/api.models';
import { IconComponent }          from '../../../../shared/components/icon/icon.component';
import { VayoModalComponent }     from '../../../../shared/components/vayo-modal/vayo-modal.component';
import { ConfirmService }         from '../../../../core/services/confirm.service';

type FormMode = 'create' | 'edit';

interface CategoryForm {
  name:        string;
  description: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, VayoModalComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  private readonly catalogSvc = inject(CatalogService);
  private readonly confirm    = inject(ConfirmService);

  categories: ApiCategory[] = [];
  loading    = true;
  loadError  = '';

  showModal  = false;
  formMode: FormMode = 'create';
  editingId  = '';
  form: CategoryForm = { name: '', description: '' };
  saving     = false;
  formError  = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';
    this.catalogSvc.getCategories(true).subscribe({
      next: (res) => {
        this.categories = res.data ?? [];
        this.loading    = false;
      },
      error: () => {
        this.loadError = 'Error al cargar categorías.';
        this.loading   = false;
      },
    });
  }

  openCreate(): void {
    this.formMode  = 'create';
    this.editingId = '';
    this.form      = { name: '', description: '' };
    this.formError = '';
    this.showModal = true;
  }

  openEdit(cat: ApiCategory): void {
    this.formMode  = 'edit';
    this.editingId = cat.id;
    this.form      = { name: cat.name, description: cat.description ?? '' };
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

    this.saving    = true;
    this.formError = '';

    const payload = {
      name:        this.form.name.trim(),
      description: this.form.description.trim() || undefined,
    };

    const obs$ = this.formMode === 'create'
      ? this.catalogSvc.createCategory(payload)
      : this.catalogSvc.updateCategory(this.editingId, payload);

    obs$.subscribe({
      next: () => {
        this.saving    = false;
        this.showModal = false;
        this.load();
      },
      error: (err) => {
        this.saving    = false;
        this.formError = err?.error?.error ?? 'Error al guardar.';
      },
    });
  }

  async confirmDeactivate(id: string): Promise<void> {
    const cat = this.categories.find((c) => c.id === id);
    const ok = await this.confirm.ask({
      title: 'Desactivar categoría',
      message: `Se desactivará "${cat?.name ?? 'esta categoría'}". Los productos asociados podrían dejar de mostrarse en ella. Podrás reactivarla luego.`,
      confirmLabel: 'Desactivar',
      tone: 'danger',
    });
    if (!ok) return;
    this.deactivate(id);
  }

  deactivate(id: string): void {
    this.catalogSvc.deactivateCategory(id).subscribe({
      next: () => {
        this.load();
      },
      error: () => {
      },
    });
  }

  /** Reactiva una categoría inactiva (update con isActive=true). */
  reactivate(cat: ApiCategory): void {
    this.catalogSvc.updateCategory(cat.id, { isActive: true }).subscribe({
      next: () => this.load(),
    });
  }
}
