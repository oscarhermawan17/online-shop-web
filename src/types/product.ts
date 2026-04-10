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
  priceOverride?: number | null;
  wholesalePriceOverride?: number | null;
  stock: number;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
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
}

export interface ProductListItem {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  wholesalePrice?: number | null;
  stock: number;
  isActive: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  basePrice: number;
  wholesalePrice?: number;
  stock: number;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  basePrice?: number;
  wholesalePrice?: number | null;
  stock?: number;
  isActive?: boolean;
}

export interface CreateVariantPayload {
  name: string;
  priceOverride?: number | null;
  wholesalePriceOverride?: number | null;
  stock: number;
}

export interface UpdateVariantPayload {
  name?: string;
  priceOverride?: number | null;
  wholesalePriceOverride?: number | null;
  stock?: number;
}

export interface AddProductImagePayload {
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
}
