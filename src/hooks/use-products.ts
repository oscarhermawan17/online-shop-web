import useSWR from 'swr';
import { fetcher, responseFetcher } from '@/lib/api';
import { buildPublicProductsUrl, type PublicProductsParams } from '@/lib/products';
import type { PaginatedResponse, ProductListItem, Product } from '@/types';

// Hook for fetching all products (public)
export function useProducts(params: PublicProductsParams = {}) {
  const url = buildPublicProductsUrl(params);

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<ProductListItem>>(
    url,
    responseFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    products: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Hook for fetching single product (public)
export function useProduct(productId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Product>(
    productId ? `/products/${productId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    product: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Hook for fetching admin products
export function useAdminProducts() {
  const { data, error, isLoading, mutate } = useSWR<ProductListItem[]>(
    '/admin/products',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    products: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Hook for fetching single admin product
export function useAdminProduct(productId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Product>(
    productId ? `/admin/products/${productId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    product: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
