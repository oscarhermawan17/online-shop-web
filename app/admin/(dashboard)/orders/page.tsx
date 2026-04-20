'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Loader2,
  PackageCheck,
  Truck,
  WalletCards,
} from 'lucide-react';

import { ShipOrderDialog } from '@/components/admin';
import { EmptyState, ErrorMessage, LoadingPage, OrderCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAdminOrders,
  useAdminShippingDrivers,
  useAdminShippingShifts,
} from '@/hooks';
import api from '@/lib/api';
import { getShippingShiftLabel, orderStatusLabels } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';

const tabItems: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending_payment', label: 'Menunggu Bayar' },
  { value: 'waiting_confirmation', label: 'Konfirmasi' },
  { value: 'paid', label: 'Dibayar' },
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

const getTodayDateInputValue = () => toDateInputValue(new Date());

const getFirstDayOfCurrentMonth = () => {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
};

type BulkAction = 'confirm' | 'settle-credit' | 'pickup' | 'ship' | 'done';

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState<BulkAction | null>(null);

  const [isBulkShipDialogOpen, setIsBulkShipDialogOpen] = useState(false);
  const [bulkShipTargetIds, setBulkShipTargetIds] = useState<string[]>([]);
  const [bulkShipDate, setBulkShipDate] = useState(getTodayDateInputValue());
  const [bulkShipShiftId, setBulkShipShiftId] = useState('');
  const [bulkShipDriverName, setBulkShipDriverName] = useState('');

  const status = activeTab === 'all' ? undefined : (activeTab as OrderStatus);

  const { orders, isLoading, isError, mutate } = useAdminOrders({
    status,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const {
    shifts,
    isLoading: isLoadingShifts,
    isError: isShiftsError,
  } = useAdminShippingShifts();
  const {
    drivers,
    isLoading: isLoadingDrivers,
    isError: isDriversError,
  } = useAdminShippingDrivers();

  const activeShifts = useMemo(
    () => shifts.filter((shift) => shift.isActive).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [shifts],
  );

  const activeDrivers = useMemo(
    () => drivers.filter((driver) => driver.isActive).sort((a, b) => a.name.localeCompare(b.name)),
    [drivers],
  );

  const selectedOrderIdSet = useMemo(() => new Set(selectedOrderIds), [selectedOrderIds]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedOrderIdSet.has(order.id)),
    [orders, selectedOrderIdSet],
  );

  const confirmableOrderIds = useMemo(
    () => selectedOrders
      .filter((order) => order.status === 'waiting_confirmation' && order.paymentMethod !== 'credit')
      .map((order) => order.id),
    [selectedOrders],
  );

  const settleCreditOrderIds = useMemo(
    () => selectedOrders
      .filter(
        (order) =>
          order.paymentMethod === 'credit'
          && !order.creditSettledAt
          && order.status !== 'cancelled'
          && order.status !== 'expired_unpaid',
      )
      .map((order) => order.id),
    [selectedOrders],
  );

  const pickupOrderIds = useMemo(
    () => selectedOrders
      .filter((order) => order.status === 'paid' && order.deliveryMethod === 'pickup')
      .map((order) => order.id),
    [selectedOrders],
  );

  const deliveryOrderIds = useMemo(
    () => selectedOrders
      .filter((order) => order.status === 'paid' && order.deliveryMethod === 'delivery')
      .map((order) => order.id),
    [selectedOrders],
  );

  const doneOrderIds = useMemo(
    () => selectedOrders
      .filter((order) => order.status === 'shipped')
      .map((order) => order.id),
    [selectedOrders],
  );

  const allVisibleSelected = orders.length > 0 && selectedOrderIds.length === orders.length;
  const hasSelectedOrders = selectedOrderIds.length > 0;

  useEffect(() => {
    setSelectedOrderIds((prev) => {
      const next = prev.filter((id) => orders.some((order) => order.id === id));
      return next.length === prev.length ? prev : next;
    });
  }, [orders]);

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    setSelectedOrderIds([]);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (value && endDate && value > endDate) {
      setEndDate(value);
    }
    setSelectedOrderIds([]);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (value && startDate && value < startDate) {
      setStartDate(value);
    }
    setSelectedOrderIds([]);
  };

  const handleSetDateToThisMonth = () => {
    setStartDate(getFirstDayOfCurrentMonth());
    setEndDate(getTodayDateInputValue());
    setSelectedOrderIds([]);
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setSelectedOrderIds([]);
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => (
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    ));
  };

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedOrderIds([]);
      return;
    }

    setSelectedOrderIds(orders.map((order) => order.id));
  };

  const handleConfirmPayment = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/confirm`);
      toast.success('Pembayaran berhasil dikonfirmasi');
      mutate();
    } catch {
      toast.error('Gagal mengkonfirmasi pembayaran');
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: 'shipped' | 'done',
    deliveryMethod: Order['deliveryMethod'],
  ) => {
    setLoadingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
      });
      toast.success(
        newStatus === 'shipped'
          ? deliveryMethod === 'pickup'
            ? 'Pengambilan pesanan berhasil dikonfirmasi'
            : 'Pesanan ditandai sebagai dikirim'
          : 'Pesanan selesai',
      );
      mutate();
    } catch {
      toast.error('Gagal mengubah status pesanan');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSettleCredit = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/settle-credit`);
      toast.success('Invoice credit berhasil ditandai lunas');
      mutate();
    } catch (error: unknown) {
      console.error('Settle credit error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal melunasi invoice credit');
    } finally {
      setLoadingId(null);
    }
  };

  const executeBulkAction = async (
    action: BulkAction,
    orderIds: string[],
    executor: (orderId: string) => Promise<unknown>,
    successLabel: string,
  ) => {
    if (orderIds.length === 0) {
      toast.error(`Tidak ada pesanan yang memenuhi syarat untuk aksi ${successLabel}.`);
      return { successCount: 0, failedCount: 0 };
    }

    setBulkActionLoading(action);

    try {
      const results = await Promise.allSettled(orderIds.map((orderId) => executor(orderId)));
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} pesanan berhasil diproses (${successLabel}).`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} pesanan gagal diproses (${successLabel}).`);
      }

      await mutate();
      setSelectedOrderIds((prev) => prev.filter((id) => !orderIds.includes(id)));

      return { successCount, failedCount };
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleBulkConfirmPayment = async () => {
    await executeBulkAction(
      'confirm',
      confirmableOrderIds,
      (orderId) => api.patch(`/admin/orders/${orderId}/confirm`),
      'Konfirmasi Bayar',
    );
  };

  const handleBulkSettleCredit = async () => {
    await executeBulkAction(
      'settle-credit',
      settleCreditOrderIds,
      (orderId) => api.patch(`/admin/orders/${orderId}/settle-credit`),
      'Lunasi Credit',
    );
  };

  const handleBulkConfirmPickup = async () => {
    await executeBulkAction(
      'pickup',
      pickupOrderIds,
      (orderId) => api.patch(`/admin/orders/${orderId}/status`, { status: 'shipped' }),
      'Konfirmasi Pengambilan',
    );
  };

  const handleBulkFinish = async () => {
    await executeBulkAction(
      'done',
      doneOrderIds,
      (orderId) => api.patch(`/admin/orders/${orderId}/status`, { status: 'done' }),
      'Selesaikan Pesanan',
    );
  };

  const openBulkShipDialog = () => {
    if (deliveryOrderIds.length === 0) {
      toast.error('Tidak ada pesanan delivery berstatus Dibayar yang dipilih.');
      return;
    }

    setBulkShipTargetIds(deliveryOrderIds);
    setBulkShipDate(getTodayDateInputValue());
    setBulkShipShiftId('');
    setBulkShipDriverName('');
    setIsBulkShipDialogOpen(true);
  };

  const handleBulkShip = async () => {
    if (!bulkShipDate) {
      toast.error('Tanggal pengiriman wajib diisi.');
      return;
    }
    if (!bulkShipShiftId) {
      toast.error('Shift pengiriman wajib dipilih.');
      return;
    }
    if (!bulkShipDriverName) {
      toast.error('Driver pengiriman wajib dipilih.');
      return;
    }

    const result = await executeBulkAction(
      'ship',
      bulkShipTargetIds,
      (orderId) => api.patch(`/admin/orders/${orderId}/ship`, {
        deliveryDate: bulkShipDate,
        shiftId: bulkShipShiftId,
        driverName: bulkShipDriverName,
      }),
      'Jadwalkan Pengiriman',
    );

    if (result.successCount > 0) {
      setIsBulkShipDialogOpen(false);
      setBulkShipTargetIds([]);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Pesanan"
        message="Tidak dapat memuat daftar pesanan"
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesanan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola semua pesanan masuk dari pelanggan
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList
            variant="pill"
            className="w-full justify-start overflow-x-auto"
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
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Filter Tanggal & Aksi Massal</CardTitle>
            <CardDescription>
              Filter tanggal dapat dikosongkan untuk menampilkan semua data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
              <div className="flex items-end">
                <Button type="button" variant="outline" className="w-full" onClick={handleSetDateToThisMonth}>
                  Bulan Ini
                </Button>
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" className="w-full" onClick={handleClearDateFilter}>
                  Semua Tanggal
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedOrderIds.length} dipilih dari {orders.length} pesanan
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                  {allVisibleSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrderIds([])}
                  disabled={!hasSelectedOrders}
                >
                  Hapus Pilihan
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleBulkConfirmPayment}
                disabled={confirmableOrderIds.length === 0 || bulkActionLoading !== null}
              >
                {bulkActionLoading === 'confirm' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Konfirmasi Bayar ({confirmableOrderIds.length})
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleBulkSettleCredit}
                disabled={settleCreditOrderIds.length === 0 || bulkActionLoading !== null}
              >
                {bulkActionLoading === 'settle-credit' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WalletCards className="mr-2 h-4 w-4" />}
                Lunasi Credit ({settleCreditOrderIds.length})
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleBulkConfirmPickup}
                disabled={pickupOrderIds.length === 0 || bulkActionLoading !== null}
              >
                {bulkActionLoading === 'pickup' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Konfirmasi Pengambilan ({pickupOrderIds.length})
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openBulkShipDialog}
                disabled={deliveryOrderIds.length === 0 || bulkActionLoading !== null}
              >
                {bulkActionLoading === 'ship' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                Jadwalkan Pengiriman ({deliveryOrderIds.length})
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleBulkFinish}
                disabled={doneOrderIds.length === 0 || bulkActionLoading !== null}
              >
                {bulkActionLoading === 'done' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
                Selesaikan ({doneOrderIds.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {orders.length === 0 ? (
          <EmptyState
            type="orders"
            title="Belum Ada Pesanan"
            description={
              activeTab === 'all'
                ? 'Pesanan akan muncul di sini ketika ada pembeli.'
                : `Tidak ada pesanan dengan status "${orderStatusLabels[activeTab] || activeTab}" untuk filter tanggal ini.`
            }
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {orders.length} pesanan
            </p>
            {orders.map((order) => {
              const isSelected = selectedOrderIdSet.has(order.id);

              return (
                <OrderCard
                  key={order.id}
                  order={order}
                  detailHref={`/admin/orders/${order.id}`}
                  showCustomer
                  showShippingSummary
                  headerActions={(
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      className="h-8"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleSelectOrder(order.id);
                      }}
                    >
                      {isSelected ? 'Dipilih' : 'Pilih'}
                    </Button>
                  )}
                  footerActions={(
                    <AdminActions
                      order={order}
                      isLoading={loadingId === order.id}
                      onRefresh={() => { mutate(); }}
                      onConfirmPayment={handleConfirmPayment}
                      onSettleCredit={handleSettleCredit}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  )}
                />
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isBulkShipDialogOpen} onOpenChange={setIsBulkShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jadwalkan Pengiriman Massal</DialogTitle>
            <DialogDescription>
              Atur satu jadwal untuk {bulkShipTargetIds.length} pesanan delivery terpilih.
            </DialogDescription>
          </DialogHeader>

          {isLoadingShifts ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memuat shift pengiriman...
            </div>
          ) : isLoadingDrivers ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memuat daftar driver pengiriman...
            </div>
          ) : isShiftsError ? (
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">
                Gagal memuat master shift pengiriman.
              </p>
              <p className="text-sm text-muted-foreground">
                Coba refresh halaman, lalu buka dialog ini lagi.
              </p>
            </div>
          ) : isDriversError ? (
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">
                Gagal memuat master driver pengiriman.
              </p>
              <p className="text-sm text-muted-foreground">
                Coba refresh halaman, lalu buka dialog ini lagi.
              </p>
            </div>
          ) : activeShifts.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">Belum ada shift pengiriman aktif.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/shipping-shifts">Kelola Shift Pengiriman</Link>
              </Button>
            </div>
          ) : activeDrivers.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">Belum ada driver pengiriman aktif.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/shipping-drivers">Kelola Driver Pengiriman</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-delivery-date">Tanggal Pengiriman *</Label>
                <Input
                  id="bulk-delivery-date"
                  type="date"
                  value={bulkShipDate}
                  onChange={(event) => setBulkShipDate(event.target.value)}
                  disabled={bulkActionLoading === 'ship'}
                />
              </div>

              <div className="space-y-2">
                <Label>Shift Pengiriman *</Label>
                <Select
                  value={bulkShipShiftId}
                  onValueChange={setBulkShipShiftId}
                  disabled={bulkActionLoading === 'ship'}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih shift pengiriman" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeShifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {getShippingShiftLabel(shift)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Driver / Kurir *</Label>
                <Select
                  value={bulkShipDriverName}
                  onValueChange={setBulkShipDriverName}
                  disabled={bulkActionLoading === 'ship'}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih driver / kurir" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.name}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsBulkShipDialogOpen(false)}
                  disabled={bulkActionLoading === 'ship'}
                >
                  Batal
                </Button>
                <Button type="button" className="flex-1" onClick={handleBulkShip} disabled={bulkActionLoading === 'ship'}>
                  {bulkActionLoading === 'ship' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="mr-2 h-4 w-4" />
                  )}
                  Kirim Pesanan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminActions({
  order,
  isLoading,
  onRefresh,
  onConfirmPayment,
  onSettleCredit,
  onUpdateStatus,
}: {
  order: Order;
  isLoading: boolean;
  onRefresh: () => void | Promise<void>;
  onConfirmPayment: (id: string) => void;
  onSettleCredit: (id: string) => void;
  onUpdateStatus: (
    id: string,
    status: 'shipped' | 'done',
    deliveryMethod: Order['deliveryMethod'],
  ) => void;
}) {
  const showSettleCredit = order.paymentMethod === 'credit' && !order.creditSettledAt;

  if (
    !showSettleCredit
    && order.status !== 'waiting_confirmation'
    && order.status !== 'paid'
    && order.status !== 'shipped'
  ) {
    return null;
  }

  return (
    <>
      {showSettleCredit && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSettleCredit(order.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <WalletCards className="mr-1.5 h-4 w-4" />
          )}
          Lunasi Credit
        </Button>
      )}

      {order.status === 'waiting_confirmation' && (
        <Button
          size="sm"
          onClick={() => onConfirmPayment(order.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-4 w-4" />
          )}
          Konfirmasi
        </Button>
      )}

      {order.status === 'paid' && (
        order.deliveryMethod === 'delivery' ? (
          <ShipOrderDialog order={order} onSuccess={onRefresh}>
            {({ open, isSubmitting }) => (
              <Button size="sm" onClick={open} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="mr-1.5 h-4 w-4" />
                )}
                Kirim
              </Button>
            )}
          </ShipOrderDialog>
        ) : (
          <Button
            size="sm"
            onClick={() => onUpdateStatus(order.id, 'shipped', order.deliveryMethod)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-4 w-4" />
            )}
            Konfirmasi Pengambilan
          </Button>
        )
      )}

      {order.status === 'shipped' && (
        <Button
          size="sm"
          onClick={() => onUpdateStatus(order.id, 'done', order.deliveryMethod)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <PackageCheck className="mr-1.5 h-4 w-4" />
          )}
          Selesai
        </Button>
      )}
    </>
  );
}
