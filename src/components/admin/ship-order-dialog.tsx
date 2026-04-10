'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminShippingDrivers, useAdminShippingShifts } from '@/hooks';
import api from '@/lib/api';
import { shipOrderSchema, type ShipOrderFormData } from '@/lib/validations';
import { getShippingShiftLabel } from '@/lib/utils';
import type { Order } from '@/types';
import { toast } from 'sonner';

interface ShipOrderDialogProps {
  order: Order | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
  children?: (props: {
    open: () => void;
    isSubmitting: boolean;
  }) => React.ReactNode;
}

function getTodayDateInputValue() {
  const date = new Date();
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

const defaultValues: ShipOrderFormData = {
  deliveryDate: getTodayDateInputValue(),
  shiftId: '',
  driverName: '',
};

export function ShipOrderDialog({
  order,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
  children,
}: ShipOrderDialogProps) {
  const { shifts, isLoading, isError } = useAdminShippingShifts();
  const {
    drivers,
    isLoading: isDriversLoading,
    isError: isDriversError,
  } = useAdminShippingDrivers();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = controlledOpen ?? internalOpen;

  const activeShifts = useMemo(
    () =>
      shifts
        .filter((shift) => shift.isActive)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [shifts],
  );
  const activeDrivers = useMemo(
    () =>
      drivers
        .filter((driver) => driver.isActive)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [drivers],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShipOrderFormData>({
    resolver: zodResolver(shipOrderSchema),
    defaultValues,
  });

  const setDialogOpen = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setDialogOpen(nextOpen);

    if (nextOpen) {
      reset({
        deliveryDate: getTodayDateInputValue(),
        shiftId: '',
        driverName: '',
      });
    }
  };

  const submitAssignment = async (data: ShipOrderFormData) => {
    if (!order) {
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch(`/admin/orders/${order.id}/ship`, data);
      toast.success('Jadwal pengiriman berhasil disimpan');
      setDialogOpen(false);
      reset(defaultValues);
      await onSuccess?.();
    } catch (error: unknown) {
      console.error('Ship order error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || 'Gagal menjadwalkan pengiriman',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) {
    return null;
  }

  const selectedShift = activeShifts.find(
    (shift) => shift.id === watch('shiftId'),
  );

  return (
    <>
      {children?.({
        open: () => handleOpenChange(true),
        isSubmitting,
      })}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jadwalkan Pengiriman</DialogTitle>
            <DialogDescription>
              Atur tanggal kirim, shift, dan driver untuk pesanan{' '}
              <span className="font-mono">{order.publicOrderId}</span>.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memuat shift pengiriman...
            </div>
          ) : isDriversLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memuat daftar driver pengiriman...
            </div>
          ) : isError ? (
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
              <p className="text-sm font-medium">
                Belum ada shift pengiriman aktif.
              </p>
              <p className="text-sm text-muted-foreground">
                Tambahkan atau aktifkan shift terlebih dahulu agar order bisa
                dijadwalkan.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/shipping-shifts">Kelola Shift Pengiriman</Link>
              </Button>
            </div>
          ) : activeDrivers.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">
                Belum ada driver pengiriman aktif.
              </p>
              <p className="text-sm text-muted-foreground">
                Tambahkan atau aktifkan driver terlebih dahulu agar admin bisa
                memilih kurir dari daftar.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/shipping-drivers">
                  Kelola Driver Pengiriman
                </Link>
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(submitAssignment)}
              className="space-y-4"
            >
              <input type="hidden" {...register('shiftId')} />
              <input type="hidden" {...register('driverName')} />

              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">Pelanggan</p>
                <p className="text-sm font-medium">
                  {order.customerName || '-'} · {order.customerPhone || '-'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Tanggal Pengiriman *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  {...register('deliveryDate')}
                  disabled={isSubmitting}
                />
                {errors.deliveryDate && (
                  <p className="text-sm text-destructive">
                    {errors.deliveryDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Shift Pengiriman *</Label>
                <Select
                  value={watch('shiftId')}
                  onValueChange={(value) =>
                    setValue('shiftId', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={isSubmitting}
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
                {errors.shiftId && (
                  <p className="text-sm text-destructive">
                    {errors.shiftId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Driver / Kurir *</Label>
                <Select
                  value={watch('driverName')}
                  onValueChange={(value) =>
                    setValue('driverName', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={isSubmitting}
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
                {errors.driverName && (
                  <p className="text-sm text-destructive">
                    {errors.driverName.message}
                  </p>
                )}
              </div>

              {selectedShift && (
                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Ringkasan assignment
                  </p>
                  <p className="text-sm font-medium">
                    {getShippingShiftLabel(selectedShift)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Driver: {watch('driverName') || '-'}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="mr-2 h-4 w-4" />
                  )}
                  Kirim Pesanan
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
