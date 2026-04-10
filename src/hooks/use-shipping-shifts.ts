import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { ShippingShift } from '@/types';

export function useAdminShippingShifts() {
  const { data, error, isLoading, mutate } = useSWR<ShippingShift[]>(
    '/admin/shipping-shifts',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    shifts: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
