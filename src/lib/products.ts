import type { PaginatedResponse, ProductListItem } from '@/types';

export const DEFAULT_PRODUCT_PAGE_LIMIT = 10;

export interface PublicProductsParams {
  storeId?: string;
  q?: string;
  category?: string | string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  promoOnly?: boolean;
  page?: number;
  limit?: number;
}

export const normalizeCategoryValues = (value?: string | string[] | null) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const seen = new Set<string>();

  return values
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) {
        return false;
      }

      const normalizedItem = item.toLowerCase();
      if (seen.has(normalizedItem)) {
        return false;
      }

      seen.add(normalizedItem);
      return true;
    });
};

const normalizePositiveInteger = (value?: number, fallback = 1) => {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    return fallback;
  }

  return Number(value);
};

export const buildPublicProductsUrl = (params: PublicProductsParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.storeId?.trim()) {
    searchParams.set('storeId', params.storeId.trim());
  }

  if (params.q?.trim()) {
    searchParams.set('q', params.q.trim());
  }

  const categories = normalizeCategoryValues(params.category);
  categories.forEach((category) => {
    searchParams.append('category', category);
  });

  if (typeof params.minPrice === 'number' && Number.isFinite(params.minPrice) && params.minPrice >= 0) {
    searchParams.set('minPrice', String(params.minPrice));
  }

  if (typeof params.maxPrice === 'number' && Number.isFinite(params.maxPrice) && params.maxPrice >= 0) {
    searchParams.set('maxPrice', String(params.maxPrice));
  }

  if (params.promoOnly) {
    searchParams.set('promoOnly', 'true');
  }

  const page = normalizePositiveInteger(params.page, 1);
  if (page > 1) {
    searchParams.set('page', String(page));
  }

  const limit = normalizePositiveInteger(params.limit, DEFAULT_PRODUCT_PAGE_LIMIT);
  if (limit !== DEFAULT_PRODUCT_PAGE_LIMIT) {
    searchParams.set('limit', String(limit));
  }

  const queryString = searchParams.toString();
  return queryString ? `/products?${queryString}` : '/products';
};

export async function fetchPublicProducts(
  params: PublicProductsParams = {},
): Promise<PaginatedResponse<ProductListItem>> {
  const baseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const url = `${baseUrl}${buildPublicProductsUrl(params)}`;
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  const result = await response.json() as PaginatedResponse<ProductListItem>;
  return result;
}
