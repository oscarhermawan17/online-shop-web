import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { ProductListItem, Product } from '@/types';

// Hook for fetching all products (public)
export function useProducts(storeId?: string) {
  const url = storeId ? `/products?storeId=${storeId}` : '/products';
  
  const { data, error, isLoading, mutate } = useSWR<ProductListItem[]>(
    url,
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
