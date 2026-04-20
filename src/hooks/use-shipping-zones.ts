import useSWR from 'swr';
import { fetcher } from '@/lib/api';

const EMPTY_ZONES: ShippingZone[] = [];

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
    zones: data ?? EMPTY_ZONES,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
