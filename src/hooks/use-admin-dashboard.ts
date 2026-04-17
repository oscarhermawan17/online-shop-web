import useSWR from 'swr';
import api from '@/lib/api';

export type DashboardPeriod = 'today' | 'yesterday' | 'this_month' | 'last_month' | 'custom';

export interface DashboardData {
  totalSales: {
    value: number;
    growth: number;
  };
  totalOrders: {
    value: number;
    growth: number;
  };
  newCustomers: {
    value: number;
    growth: number;
  };
  salesTrend: {
    date: string;
    sales: number;
    orders: number;
  }[];
  topItemsByCount: {
    id: string;
    name: string;
    count: number;
  }[];
  topItemsByValue: {
    id: string;
    name: string;
    value: number;
  }[];
}

/** Shape returned by GET /api/admin/dashboard */
interface AdminDashboardApiPayload {
  period?: string;
  statistics?: {
    totalSales?: number;
    totalOrders?: number;
    newCustomers?: number;
  };
  comparison?: {
    salesGrowth?: number;
    ordersGrowth?: number;
    customersGrowth?: number;
  };
  charts?: {
    salesTrend?: { label: string; value: number }[];
  };
  rankings?: {
    mostSoldByCount?: { name: string; count: number; value: number }[];
    mostSoldByValue?: { name: string; count: number; value: number }[];
  };
}

function mapApiToDashboard(raw: AdminDashboardApiPayload | undefined | null): DashboardData {
  const stats = raw?.statistics ?? {};
  const comp = raw?.comparison ?? {};
  const trend = raw?.charts?.salesTrend ?? [];
  const byCount = raw?.rankings?.mostSoldByCount ?? [];
  const byValue = raw?.rankings?.mostSoldByValue ?? [];

  return {
    totalSales: {
      value: stats.totalSales ?? 0,
      growth: comp.salesGrowth ?? 0,
    },
    totalOrders: {
      value: stats.totalOrders ?? 0,
      growth: comp.ordersGrowth ?? 0,
    },
    newCustomers: {
      value: stats.newCustomers ?? 0,
      growth: comp.customersGrowth ?? 0,
    },
    salesTrend: trend.map((row) => ({
      date: row.label,
      sales: row.value,
      orders: 0,
    })),
    topItemsByCount: byCount.map((item, i) => ({
      id: `count-${i}-${item.name}`,
      name: item.name,
      count: item.count,
    })),
    topItemsByValue: byValue.map((item, i) => ({
      id: `value-${i}-${item.name}`,
      name: item.name,
      value: item.value,
    })),
  };
}

async function fetchDashboard(url: string): Promise<DashboardData> {
  const response = await api.get<{ success: boolean; data: AdminDashboardApiPayload }>(url);
  return mapApiToDashboard(response.data.data);
}

export function useAdminDashboard(period: DashboardPeriod, startDate?: string, endDate?: string) {
  let url = `/admin/dashboard?period=${period}`;
  if (period === 'custom' && startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }

  const { data, error, isLoading, mutate } = useSWR<DashboardData>(url, fetchDashboard, {
    revalidateOnFocus: true,
  });

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
