import useSWR from 'swr';
import { fetcher } from '@/lib/api';

export interface ShippingZone {
  id: string;
  storeId: string;
  name: string;
  cost: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useAdminShippingZones() {
  const { data, error, isLoading, mutate } = useSWR<ShippingZone[]>(
    '/admin/shipping-zones',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    zones: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
