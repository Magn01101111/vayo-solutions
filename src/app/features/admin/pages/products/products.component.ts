import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { CatalogService }  from '../../../../core/services/catalog.service';
import { UploadService }   from '../../../../core/services/upload.service';
import {
  ApiProductListItem,
  ApiCategory,
  CreateProductPayload,
  ApiProductAvailabilityStatus,
} from '../../../../core/models/api.models';

type FormMode = 'create' | 'edit';

interface ProductForm {
  categoryId:         string;
  name:               string;
  sku:                string;
  brand:              string;
  model:              string;
  description:        string;
  price:              string;
  stock:              string;
  availabilityStatus: ApiProductAvailabilityStatus;
  tags:               string;
  imageUrl:           string;
  imagePublicId:      string;
}

function emptyForm(): ProductForm {
  return {
    categoryId:         '',
    name:               '',
    sku:                '',
    brand:              '',
    model:              '',
    description:        '',
    price:              '',
    stock:              '0',
    availabilityStatus: 'in_stock',
    tags:               '',
    imageUrl:           '',
    imagePublicId:      '',
  };
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  private readonly catalogSvc = inject(CatalogService);
  private readonly uploadSvc  = inject(UploadService);

  // ── List state ────────────────────────────────────────────────────────────
  products:   ApiProductListItem[] = [];
  categories: ApiCategory[]        = [];
  loading    = true;
  loadError  = '';
  searchQ    = '';
  filterCat  = '';

  // ── Modal ─────────────────────────────────────────────────────────────────
  showModal  = false;
  formMode: FormMode = 'create';
  editingId  = '';
  form: ProductForm  = emptyForm();
  saving     = false;
  formError  = '';

  // ── Imagen (estado local) ─────────────────────────────────────────────────
  uploadingImage = false;
  imageError     = '';

  // ── Confirm deactivate ────────────────────────────────────────────────────
  confirmingId = '';

  readonly statusOptions: { value: ApiProductAvailabilityStatus; label: string }[] = [
    { value: 'in_stock',     label: 'En stock' },
    { value: 'out_of_stock', label: 'Sin stock' },
    { value: 'on_request',   label: 'A pedido' },
    { value: 'discontinued', label: 'Descontinuado' },
  ];

  ngOnInit(): void {
    this.loadCategories();
    this.load();
  }

  loadCategories(): void {
    this.catalogSvc.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data ?? [];
      },
    });
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';

    this.catalogSvc.getProducts(
      this.filterCat  || undefined,
      this.searchQ.trim() || undefined,
    ).subscribe({
      next: (res) => {
        this.products = res.data ?? [];
        this.loading  = false;
      },
      error: () => {
        this.loadError = 'Error al cargar productos.';
        this.loading   = false;
      },
    });
  }

  onSearch(): void {
    this.load();
  }

  clearSearch(): void {
    this.searchQ  = '';
    this.filterCat = '';
    this.load();
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  openCreate(): void {
    this.formMode  = 'create';
    this.editingId = '';
    this.form      = emptyForm();
    this.formError = '';
    this.imageError = '';
    this.showModal = true;
  }

  openEdit(product: ApiProductListItem): void {
    this.formMode  = 'edit';
    this.editingId = product.id;
    this.form = {
      categoryId:         product.categoryId ?? '',
      name:               product.name,
      sku:                product.sku,
      brand:              product.brand,
      model:              product.model ?? '',
      description:        product.description ?? '',
      price:              product.price != null ? String(product.price) : '',
      stock:              String(product.stock),
      availabilityStatus: product.availabilityStatus,
      tags:               product.tags.join(', '),
      imageUrl:           product.imageUrl ?? '',
      imagePublicId:      product.imagePublicId ?? '',
    };
    this.formError  = '';
    this.imageError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  // ── Manejo de imagen ──────────────────────────────────────────────────────

  /** Handler del <input type="file">. Sube directo a Cloudinary vía backend. */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    // Validación cliente antes de mandar al servidor
    const validationError = this.uploadSvc.validateImageFile(file);
    if (validationError) {
      this.imageError = validationError;
      input.value = ''; // limpiar input
      return;
    }

    this.imageError     = '';
    this.uploadingImage = true;

    this.uploadSvc.uploadProductImage(file).subscribe({
      next: ({ url, publicId }) => {
        this.form.imageUrl      = url;
        this.form.imagePublicId = publicId;
        this.uploadingImage     = false;
        input.value = ''; // permitir re-seleccionar el mismo archivo
      },
      error: (err) => {
        this.uploadingImage = false;
        this.imageError = err?.error?.error ?? 'Error al subir la imagen.';
        input.value = '';
      },
    });
  }

  removeImage(): void {
    // El backend se encarga de borrar la imagen vieja de Cloudinary cuando
    // detecta que imagePublicId cambió. Aquí solo limpiamos el form.
    this.form.imageUrl      = '';
    this.form.imagePublicId = '';
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  save(): void {
    const { categoryId, name, sku, brand, price, stock } = this.form;

    if (!categoryId || !name.trim() || !sku.trim() || !brand.trim()) {
      this.formError = 'Categoría, nombre, SKU y marca son obligatorios.';
      return;
    }

    this.saving    = true;
    this.formError = '';

    const tags = this.form.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload: CreateProductPayload = {
      categoryId,
      name:               name.trim(),
      sku:                sku.trim().toUpperCase(),
      brand:              brand.trim(),
      model:              this.form.model.trim() || undefined,
      description:        this.form.description.trim() || undefined,
      price:              price !== '' ? Number(price) : null,
      stock:              Number(stock) || 0,
      availabilityStatus: this.form.availabilityStatus,
      tags,
      imageUrl:           this.form.imageUrl      || undefined,
      imagePublicId:      this.form.imagePublicId || null,
    };

    const obs$ = this.formMode === 'create'
      ? this.catalogSvc.createProduct(payload)
      : this.catalogSvc.updateProduct(this.editingId, payload);

    obs$.subscribe({
      next: () => {
        this.saving    = false;
        this.showModal = false;
        this.load();
      },
      error: (err) => {
        this.saving    = false;
        this.formError = err?.error?.error ?? 'Error al guardar el producto.';
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
    this.catalogSvc.deactivateProduct(id).subscribe({
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

  statusLabel(status: ApiProductAvailabilityStatus): string {
    return this.statusOptions.find((o) => o.value === status)?.label ?? status;
  }

  statusBadge(status: ApiProductAvailabilityStatus): string {
    const map: Record<string, string> = {
      in_stock:     'badge-success',
      out_of_stock: 'badge-danger',
      on_request:   'badge-warning',
      discontinued: 'badge-danger',
    };
    return map[status] ?? '';
  }

  formatPrice(price: number | null): string {
    if (price == null) return 'Consultar';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
    }).format(price);
  }

  categoryName(categoryId?: string): string {
    if (!categoryId) return '—';
    return this.categories.find((c) => c.id === categoryId)?.name ?? '—';
  }
}
