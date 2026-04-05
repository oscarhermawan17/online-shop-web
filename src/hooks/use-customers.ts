import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { CustomerListItem } from '@/types';

export function useAdminCustomers() {
  const { data, error, isLoading, mutate } = useSWR<CustomerListItem[]>(
    '/admin/customers',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    customers: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
