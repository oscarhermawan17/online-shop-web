import useSWR from 'swr';

import { responseFetcher } from '@/lib/api';
import type { PaginatedResponse, ReceivableInvoiceItem } from '@/types';

export interface AdminReceivablesParams {
  page: number;
  limit: number;
  settled: 'all' | 'settled' | 'unsettled';
  startDate?: string;
  endDate?: string;
}

const buildReceivablesUrl = (params: AdminReceivablesParams) => {
  const queryParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.settled !== 'all') {
    queryParams.set('settled', params.settled);
  }

  if (params.startDate) {
    queryParams.set('startDate', params.startDate);
  }

  if (params.endDate) {
    queryParams.set('endDate', params.endDate);
  }

  return `/admin/receivables?${queryParams.toString()}`;
};

export function useAdminReceivables(params: AdminReceivablesParams) {
  const url = buildReceivablesUrl(params);

  const { data, error, isLoading, isValidating, mutate } = useSWR<PaginatedResponse<ReceivableInvoiceItem>>(
    url,
    responseFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    receivables: data?.data ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    isValidating,
    isError: !!error,
    error,
    mutate,
    url,
  };
}
