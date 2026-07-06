import {
  ApiCategory,
  ApiProductDetail,
  ApiProductListItem,
} from '../../core/models/api.models';
import {
  CatalogCategory,
  ProductCardData,
  ProductDetailData,
  ProductDocument,
  ProductProvider,
  ProductSpec,
  RelatedProduct,
} from '../../core/models/ui.models';

type ProductIcon =
  | 'compressor'
  | 'fan'
  | 'valve'
  | 'sensor'
  | 'filter'
  | 'generic';

function formatCurrency(value: number | null, currency: 'CLP'): string {
  if (value == null) {
    return 'Consultar';
  }

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function mapAvailabilityToShortStatus(
  status: 'in_stock' | 'out_of_stock' | 'on_request' | 'discontinued',
): string {
  switch (status) {
    case 'in_stock':
      return 'En stock';
    case 'on_request':
      return 'A pedido';
    case 'discontinued':
      return 'Descontinuado';
    case 'out_of_stock':
    default:
      return 'Sin stock';
  }
}

function mapAvailabilityToStockLabel(
  status: 'in_stock' | 'out_of_stock' | 'on_request' | 'discontinued',
  stock: number,
): string {
  switch (status) {
    case 'in_stock':
      return `${stock} unidades disponibles`;
    case 'on_request':
      return 'Disponible a pedido';
    case 'discontinued':
      return 'Producto descontinuado';
    case 'out_of_stock':
    default:
      return 'Sin stock inmediato';
  }
}

function mapCategorySlugToIcon(slug: string): ProductIcon {
  switch (slug) {
    case 'compresores':
      return 'compressor';
    case 'ventiladores':
      return 'fan';
    case 'valvulas':
      return 'valve';
    case 'sensores':
      return 'sensor';
    case 'filtros':
      return 'filter';
    default:
      return 'generic';
  }
}

function formatMm(value?: number): string | undefined {
  return value != null ? `${value} mm` : undefined;
}

function formatKg(value?: number): string | undefined {
  return value != null ? `${value} kg` : undefined;
}

function buildDocumentMeta(doc: {
  type: 'pdf' | 'doc' | 'image' | 'other';
  sizeMb?: number;
  provider?: string;
}): string {
  return [
    doc.type?.toUpperCase(),
    doc.sizeMb != null ? `${doc.sizeMb} MB` : undefined,
    doc.provider,
  ]
    .filter(Boolean)
    .join(' · ');
}

function mapProductSpecs(
  specs: { label: string; value: string }[] = [],
): ProductSpec[] {
  return specs.map((spec) => ({
    label: spec.label,
    value: spec.value,
  }));
}

function mapProductDocuments(
  documents: {
    title: string;
    type: 'pdf' | 'doc' | 'image' | 'other';
    sizeMb?: number;
    provider?: string;
    url?: string;
  }[] = [],
): ProductDocument[] {
  return documents.map((doc) => ({
    title: doc.title,
    meta: buildDocumentMeta(doc),
    url: doc.url,
  }));
}

/**
 * Devuelve la lista de URLs de imágenes del producto.
 * Compatibilidad: si solo viene `imageUrl` legacy, devuelve un array de uno.
 */
function resolveImageUrls(
  product: ApiProductListItem | ApiProductDetail,
): string[] {
  if (product.images && product.images.length > 0) {
    return product.images.map((i) => i.url);
  }
  return product.imageUrl ? [product.imageUrl] : [];
}

export function mapApiCategoryToCatalogCategory(
  category: ApiCategory,
): CatalogCategory {
  return {
    id: category.id,
    label: category.name,
    slug: category.slug,
    active: false,
  };
}

/* export function mapApiProductToCardData(
  product: ApiProductListItem,
  category?: { name: string; slug: string }
): ProductCardData {
  const categoryName = category?.name ?? 'Sin categoría';
  const categorySlug = category?.slug ?? 'sin-categoria';

  return {
    id: product.id,
    category: categoryName,
    categorySlug,
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: formatCurrency(product.price, product.currency),
    imageUrl: product.imageUrl,
    shortStatus: mapAvailabilityToShortStatus(product.availabilityStatus),
    stockLabel: mapAvailabilityToStockLabel(
      product.availabilityStatus,
      product.stock
    ),
    icon: mapCategorySlugToIcon(categorySlug),
    tags: product.tags ?? [],
  };
} */
export function mapApiProductToCardData(
  product: ApiProductListItem | ApiProductDetail,
  category?: { name: string; slug: string },
): ProductCardData {
  const resolvedCategory =
    category ??
    ('category' in product
      ? {
          name: product.category.name,
          slug: product.category.slug,
        }
      : undefined);

  // Fallback: si no hay objeto category ni param, usar categoryName del list item.
  const categoryName =
    resolvedCategory?.name ?? product.categoryName ?? 'Sin categoría';
  const categorySlug = resolvedCategory?.slug ?? 'sin-categoria';

  const imageUrls = resolveImageUrls(product);

  // Una oferta solo cuenta como vigente si el precio es menor Y estamos dentro
  // del rango de fechas (si están definidas). Sin esto, una oferta expirada o
  // futura se mostraría como activa en catálogo/home/ficha (rompe N02).
  const now = Date.now();
  const offerStarted =
    !product.offerStartsAt || new Date(product.offerStartsAt).getTime() <= now;
  const offerNotEnded =
    !product.offerEndsAt || new Date(product.offerEndsAt).getTime() >= now;
  const hasOffer =
    product.offerPrice != null &&
    product.offerPrice > 0 &&
    (product.price == null || product.offerPrice < product.price) &&
    offerStarted &&
    offerNotEnded;
  const offerDiscountPercent = hasOffer && product.price
    ? Math.round(((product.price - product.offerPrice!) / product.price) * 100)
    : undefined;
  const isPurchasable =
    product.availabilityStatus === 'in_stock' &&
    product.stock > 0 &&
    ((hasOffer ? product.offerPrice : product.price) ?? 0) > 0;

  return {
    id: product.id,
    category: categoryName,
    categorySlug,
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: formatCurrency(product.price, product.currency),
    priceRaw: product.price ?? null,
    imageUrl: imageUrls[0],
    images: imageUrls,
    shortStatus: mapAvailabilityToShortStatus(product.availabilityStatus),
    stockLabel: mapAvailabilityToStockLabel(
      product.availabilityStatus,
      product.stock,
    ),
    stockRaw: product.stock,
    availabilityStatus: product.availabilityStatus,
    isPurchasable,
    icon: mapCategorySlugToIcon(categorySlug),
    isFeatured: product.isFeatured,
    offerPrice: hasOffer ? formatCurrency(product.offerPrice!, product.currency) : null,
    offerPriceRaw: hasOffer ? product.offerPrice! : null,
    offerEndsAt: product.offerEndsAt ?? undefined,
    offerDiscountPercent,
    tags: product.tags ?? [],
  };
}
export function mapApiProductDetailToProductDetailData(
  product: ApiProductDetail,
): ProductDetailData {
  const imageUrls = resolveImageUrls(product);
  const now = Date.now();
  const offerStarted =
    !product.offerStartsAt || new Date(product.offerStartsAt).getTime() <= now;
  const offerNotEnded =
    !product.offerEndsAt || new Date(product.offerEndsAt).getTime() >= now;
  const hasOffer =
    product.offerPrice != null &&
    product.offerPrice > 0 &&
    (product.price == null || product.offerPrice < product.price) &&
    offerStarted &&
    offerNotEnded;
  const offerDiscountPercent = hasOffer && product.price
    ? Math.round(((product.price - product.offerPrice!) / product.price) * 100)
    : undefined;
  const isPurchasable =
    product.availabilityStatus === 'in_stock' &&
    product.stock > 0 &&
    ((hasOffer ? product.offerPrice : product.price) ?? 0) > 0;

  return {
    id: product.id,
    category: product.category.name,
    categorySlug: product.category.slug,
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: formatCurrency(product.price, product.currency),
    priceRaw: product.price ?? null,
    offerPrice: hasOffer ? formatCurrency(product.offerPrice!, product.currency) : null,
    offerPriceRaw: hasOffer ? product.offerPrice! : null,
    offerEndsAt: product.offerEndsAt ?? undefined,
    offerDiscountPercent,
    imageUrl: imageUrls[0],
    images: imageUrls,
    shortStatus: mapAvailabilityToShortStatus(product.availabilityStatus),
    stockLabel: mapAvailabilityToStockLabel(
      product.availabilityStatus,
      product.stock,
    ),
    stockRaw: product.stock,
    availabilityStatus: product.availabilityStatus,
    isPurchasable,
    icon: mapCategorySlugToIcon(product.category.slug),
    brand: product.brand,
    model: product.model,
    tags: product.tags ?? [],
    // rating/reviewCount se cargan aparte desde el endpoint de reseñas.
    rating: 0,
    reviewCount: 0,
    specs: mapProductSpecs(product.specs),
    dimensions: {
      height: formatMm(product.dimensions?.heightMm),
      width: formatMm(product.dimensions?.widthMm),
      length: formatMm(product.dimensions?.lengthMm),
      diameter: formatMm(product.dimensions?.diameterMm),
      netWeight: formatKg(product.dimensions?.netWeightKg),
      grossWeight: formatKg(product.dimensions?.grossWeightKg),
    },
    compatibility: product.compatibility ?? [],
    documents: mapProductDocuments(product.documents),
    suppliers: mapProductSuppliers(product),
  };
}

/** Mapea los proveedores asignados al producto (vienen poblados de la BD). */
function mapProductSuppliers(product: ApiProductDetail): ProductProvider[] {
  return (product.suppliers ?? [])
    .filter((s) => s && (s.name || s.id))
    .map((s) => ({
      id: s.id,
      name: s.name ?? 'Proveedor',
      location: s.location ?? '',
      deliveryTime: s.deliveryTime || 'Consultar',
      speed: s.speed ?? 'mid',
    }));
}

export function mapApiProductToRelatedProduct(
  product: ApiProductListItem,
  category?: { name: string; slug: string },
): RelatedProduct {
  const mapped = mapApiProductToCardData(product, category);

  return {
    id: mapped.id,
    name: mapped.name,
    sku: mapped.sku,
    price: mapped.price,
    imageUrl: mapped.imageUrl,
    shortStatus: mapped.shortStatus,
    category: mapped.category,
    icon: mapped.icon,
  };
}
