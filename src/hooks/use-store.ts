import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { Store } from '@/types';

// Hook for fetching admin store info
export function useAdminStore() {
  const { data, error, isLoading, mutate } = useSWR<Store>(
    '/admin/store',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    store: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
