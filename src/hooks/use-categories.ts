import useSWR from 'swr';
import { responseFetcher } from '@/lib/api';
import type { Category } from '@/types';

interface CategoriesResponse {
  data: Category[];
}

export function useAdminCategories() {
  const { data, error, isLoading, mutate } = useSWR<CategoriesResponse>(
    '/admin/categories',
    responseFetcher
  );

  return {
    categories: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
