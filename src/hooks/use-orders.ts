import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { Order, PublicOrder, OrderStatus } from '@/types';

// Hook for fetching public order by publicOrderId
export function usePublicOrder(publicOrderId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<PublicOrder>(
    publicOrderId ? `/order/${publicOrderId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    order: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Hook for fetching admin orders
export function useAdminOrders(status?: OrderStatus) {
  const url = status ? `/admin/orders?status=${status}` : '/admin/orders';
  
  const { data, error, isLoading, mutate } = useSWR<Order[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    orders: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Hook for fetching single admin order
export function useAdminOrder(orderId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Order>(
    orderId ? `/admin/orders/${orderId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    order: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
