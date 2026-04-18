import useSWR from 'swr';
import { fetcher, responseFetcher } from '@/lib/api';
import type { CustomerCreditListItem, CustomerListItem, PaginatedResponse } from '@/types';

export interface CustomerListParams {
  page: number;
  limit: number;
  search: string;
  status: 'all' | 'active' | 'inactive';
}

export function useAdminCustomers(params: CustomerListParams) {
  const qs = new URLSearchParams({
    page:  String(params.page),
    limit: String(params.limit),
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
  }).toString();

  const { data, error, isLoading, isValidating, mutate } = useSWR<PaginatedResponse<CustomerListItem>>(
    `/admin/customers?${qs}`,
    responseFetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  return {
    customers:    data?.data ?? [],
    pagination:   data?.pagination ?? null,
    isLoading,      // true only on the very first fetch (no data yet)
    isValidating,   // true whenever a request is in-flight (filter/page change)
    isError: !!error,
    mutate,
  };
}

export function useAdminCredits() {
  const { data, error, isLoading, mutate } = useSWR<CustomerCreditListItem[]>(
    '/admin/credit',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    credits: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
