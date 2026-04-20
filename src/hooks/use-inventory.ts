import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { InventoryMovementItem, StockMovementCategory } from '@/types';

export interface InventoryMovementFilters {
  startDate?: string;
  endDate?: string;
  productId?: string;
  variantId?: string;
  category?: StockMovementCategory | 'all';
}

const buildInventoryUrl = (filters: InventoryMovementFilters) => {
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.set('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params.set('endDate', filters.endDate);
  }
  if (filters.productId && filters.productId !== 'all') {
    params.set('productId', filters.productId);
  }
  if (filters.variantId && filters.variantId !== 'all') {
    params.set('variantId', filters.variantId);
  }
  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category);
  }

  const queryString = params.toString();
  return queryString ? `/admin/inventory?${queryString}` : '/admin/inventory';
};

export function useAdminInventoryMovements(filters: InventoryMovementFilters) {
  const url = buildInventoryUrl(filters);

  const { data, error, isLoading, mutate } = useSWR<InventoryMovementItem[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    movements: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    url,
  };
}

