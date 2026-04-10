import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { ShippingDriver } from '@/types';

export function useAdminShippingDrivers() {
  const { data, error, isLoading, mutate } = useSWR<ShippingDriver[]>(
    '/admin/shipping-drivers',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    drivers: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
