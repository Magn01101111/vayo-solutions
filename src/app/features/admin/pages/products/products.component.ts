import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

import { CatalogService }  from '../../../../core/services/catalog.service';
import { UploadService }   from '../../../../core/services/upload.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import {
  ApiProductListItem,
  ApiProductDetail,
  ApiCategory,
  ApiSupplier,
  CreateProductPayload,
  ApiProductAvailabilityStatus,
  ApiProductImage,
} from '../../../../core/models/api.models';

/** Proveedor asignado dentro del formulario de producto. */
interface FormSupplier {
  supplier: string;       // id del Supplier
  deliveryTime: string;
  speed: 'fast' | 'mid' | 'slow';
}

const MAX_IMAGES = 4;

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
  isFeatured:         boolean;
  /** Galería: hasta 4 imágenes. images[0] es la principal. */
  images:             ApiProductImage[];
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
    isFeatured:         false,
    images:             [],
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

  // ── Imágenes (estado local) ───────────────────────────────────────────────
  uploadingImage = false;
  imageError     = '';
  readonly maxImages = MAX_IMAGES;

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

    // Reconstruir images[] — manejar productos viejos que solo tienen imageUrl
    let images: ApiProductImage[] = [];
    if (product.images && product.images.length > 0) {
      images = product.images.map((i) => ({ url: i.url, publicId: i.publicId ?? null }));
    } else if (product.imageUrl) {
      images = [{ url: product.imageUrl, publicId: product.imagePublicId ?? null }];
    }

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
      isFeatured:         product.isFeatured ?? false,
      images,
    };
    this.formError  = '';
    this.imageError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  // ── Manejo de imágenes (galería de hasta 4) ───────────────────────────────

  /**
   * Handler del <input type="file">. Sube a Cloudinary y agrega al array.
   * Si ya hay 4 imágenes, no se permite agregar más (validación UI).
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    if (this.form.images.length >= MAX_IMAGES) {
      this.imageError = `Máximo ${MAX_IMAGES} imágenes por producto.`;
      input.value = '';
      return;
    }

    const validationError = this.uploadSvc.validateImageFile(file);
    if (validationError) {
      this.imageError = validationError;
      input.value = '';
      return;
    }

    this.imageError     = '';
    this.uploadingImage = true;

    this.uploadSvc.uploadProductImage(file).subscribe({
      next: ({ url, publicId }) => {
        // Agregar al final del array (NO se vuelve principal automáticamente)
        this.form.images = [...this.form.images, { url, publicId }];
        this.uploadingImage = false;
        input.value = '';
      },
      error: (err) => {
        this.uploadingImage = false;
        this.imageError = err?.error?.error ?? 'Error al subir la imagen.';
        input.value = '';
      },
    });
  }

  /** Quita una imagen del form. La eliminación en Cloudinary la hace el backend al guardar. */
  removeImageAt(index: number): void {
    this.form.images = this.form.images.filter((_, i) => i !== index);
  }

  /** Mueve la imagen del índice dado al [0] (la convierte en principal). */
  makePrimary(index: number): void {
    if (index <= 0 || index >= this.form.images.length) return;
    const reordered = [...this.form.images];
    const [chosen]  = reordered.splice(index, 1);
    reordered.unshift(chosen);
    this.form.images = reordered;
  }

  get canAddMoreImages(): boolean {
    return this.form.images.length < MAX_IMAGES;
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
      isFeatured:         this.form.isFeatured,
      images:             this.form.images,  // backend deriva imageUrl/imagePublicId desde images[0]
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
