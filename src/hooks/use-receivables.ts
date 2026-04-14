import useSWR from 'swr';

import { fetcher } from '@/lib/api';
import type { ReceivableInvoiceItem } from '@/types';

export function useAdminReceivables() {
  const { data, error, isLoading, mutate } = useSWR<ReceivableInvoiceItem[]>(
    '/admin/receivables',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    receivables: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
