import useSWR from 'swr';
import api from '@/lib/api';
import type { Category } from '@/types';

interface CategoriesResponse {
  data: Category[];
}

export function useAdminCategories() {
  const { data, error, isLoading, mutate } = useSWR<CategoriesResponse>(
    '/admin/categories',
    async (url) => {
      const res = await api.get(url);
      return res.data;
    }
  );

  return {
    categories: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
