export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string | null;
  isDefault: boolean;
  imageUrl?: string | null;
  priceOverride?: number | null;
  wholesalePriceOverride?: number | null;
  price?: number;       // resolved price from public API (already accounts for wholesale + discount)
  stock: number;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  categories: Category[];
  unitId?: string | null;
  unit?: Unit | null;
  name: string;
  description?: string | null;
  basePrice: number;
  wholesalePrice?: number | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  variants: ProductVariant[];
  discount?: ProductDiscount | null;
}

export interface ProductDiscount {
  id: string;
  normalDiscount: number | null;
  normalDiscountActive: boolean;
  retailDiscount: number | null;
  retailDiscountActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface ProductListItem {
  id: string;
  categories: Category[];
  unitId?: string | null;
  unit?: Unit | null;
  name: string;
  description?: string | null;
  basePrice: number;
  wholesalePrice?: number | null;
  stock: number;
  isActive: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  discount?: ProductDiscount | null;
}

export interface CreateProductPayload {
  categoryIds?: string[];
  unitId?: string | null;
  name: string;
  description?: string;
  basePrice?: number;
  wholesalePrice?: number | null;
  stock?: number;
  variants?: Array<{
    name?: string;
    imageUrl?: string | null;
    basePrice: number;
    wholesalePrice?: number | null;
    stock: number;
  }>;
}

export interface UpdateProductPayload {
  categoryIds?: string[];
  unitId?: string | null;
  name?: string;
  description?: string;
  basePrice?: number;
  wholesalePrice?: number | null;
  stock?: number;
  isActive?: boolean;
}

export interface CreateVariantPayload {
  name: string;
  imageUrl?: string | null;
  priceOverride?: number | null;
  wholesalePriceOverride?: number | null;
  stock: number;
}

export interface UpdateVariantPayload {
  name?: string;
  imageUrl?: string | null;
  priceOverride?: number | null;
  wholesalePriceOverride?: number | null;
  stock?: number;
}

export interface AddProductImagePayload {
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
}
