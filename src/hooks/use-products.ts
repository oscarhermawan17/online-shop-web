import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { ProductListItem, Product } from '@/types';

const buildProductsUrl = (storeId?: string, query?: string) => {
  const params = new URLSearchParams();

  if (storeId) {
    params.set('storeId', storeId);
  }

  if (query?.trim()) {
    params.set('q', query.trim());
  }

  const queryString = params.toString();
  return queryString ? `/products?${queryString}` : '/products';
};

// Hook for fetching all products (public)
export function useProducts(storeId?: string, query?: string) {
  const url = buildProductsUrl(storeId, query);
  
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
