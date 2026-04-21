'use client';

import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState, OrderCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetcher } from '@/lib/api';
import { orderStatusLabels } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types/order';
import useSWR from 'swr';

const tabItems: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending_payment', label: 'Menunggu Bayar' },
  { value: 'paid', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'done', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'expired_unpaid', label: 'Kadaluarsa' },
];

const toDateInputValue = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFirstDayOfCurrentMonth = (): string => {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
};

const getTodayDateInputValue = (): string => toDateInputValue(new Date());

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data: allOrders, isLoading } = useSWR<Order[]>(
    '/customer/orders',
    fetcher
  );

  const orders = useMemo(() => {
    if (!allOrders) {
      return [];
    }

    return allOrders.filter((order) => {
      if (activeTab !== 'all' && order.status !== activeTab) {
        return false;
      }

      if (!startDate && !endDate) {
        return true;
      }

      const createdAtDate = new Date(order.createdAt);
      if (Number.isNaN(createdAtDate.getTime())) {
        return false;
      }

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (createdAtDate < start) {
          return false;
        }
      }

      if (endDate) {
        const endExclusive = new Date(`${endDate}T00:00:00`);
        endExclusive.setDate(endExclusive.getDate() + 1);

        if (createdAtDate >= endExclusive) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, allOrders, endDate, startDate]);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (value && endDate && value > endDate) {
      setEndDate(value);
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (value && startDate && value < startDate) {
      setStartDate(value);
    }
  };

  const handleSetDateToThisMonth = () => {
    setStartDate(getFirstDayOfCurrentMonth());
    setEndDate(getTodayDateInputValue());
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 pb-24 pt-4 md:px-0 md:pb-0 md:pt-0">
        <h1 className="text-lg font-semibold">Riwayat Pesanan</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-24 pt-4 md:px-0 md:pb-0 md:pt-0">
      <div>
        <h1 className="text-lg font-semibold">Riwayat Pesanan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lihat semua riwayat pesanan Anda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Tanggal</CardTitle>
          <CardDescription>
            Tanggal bisa dikosongkan untuk menampilkan semua pesanan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => handleStartDateChange(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => handleEndDateChange(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSetDateToThisMonth}>
              Bulan Ini
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleClearDateFilter}>
              Semua Tanggal
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          variant="pill"
          className="-mx-1 w-[calc(100%+0.5rem)] justify-start overflow-x-auto px-1"
        >
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="min-w-fit"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabItems.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {orders.length === 0 ? (
              <EmptyState
                type="orders"
                title="Belum Ada Pesanan"
                description={
                  activeTab === 'all'
                    ? 'Tidak ada pesanan untuk filter tanggal saat ini.'
                    : `Tidak ada pesanan dengan status "${orderStatusLabels[activeTab] || activeTab}" untuk filter tanggal saat ini.`
                }
                actionLabel={activeTab === 'all' ? 'Mulai Belanja' : undefined}
                actionHref={activeTab === 'all' ? '/' : undefined}
              />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {orders.length} pesanan
                </p>
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
