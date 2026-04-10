'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  shippingShiftSchema,
  type ShippingShiftFormData,
} from '@/lib/validations';
import { getShippingShiftLabel } from '@/lib/utils';
import type { ShippingShift } from '@/types';

interface ShippingShiftFormProps {
  shift?: ShippingShift | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (data: ShippingShiftFormData) => Promise<void>;
}

const defaultValues: ShippingShiftFormData = {
  name: '',
  startTime: '08:00',
  endTime: '12:00',
  isActive: true,
};

export function ShippingShiftForm({
  shift,
  isSubmitting,
  onCancel,
  onSubmit,
}: ShippingShiftFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ShippingShiftFormData>({
    resolver: zodResolver(shippingShiftSchema),
    defaultValues,
  });

  const watchedName = useWatch({ control, name: 'name' });
  const watchedStartTime = useWatch({ control, name: 'startTime' });
  const watchedEndTime = useWatch({ control, name: 'endTime' });
  const watchedIsActive = useWatch({ control, name: 'isActive' });

  useEffect(() => {
    reset(
      shift
        ? {
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            isActive: shift.isActive,
          }
        : defaultValues,
    );
  }, [reset, shift]);

  const previewLabel = getShippingShiftLabel({
    name: watchedName,
    startTime: watchedStartTime,
    endTime: watchedEndTime,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shiftName">Nama Shift *</Label>
        <Input
          id="shiftName"
          placeholder="Contoh: Pagi"
          {...register('name')}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shiftStartTime">Jam Mulai *</Label>
          <Input
            id="shiftStartTime"
            type="time"
            {...register('startTime')}
            disabled={isSubmitting}
          />
          {errors.startTime && (
            <p className="text-sm text-destructive">
              {errors.startTime.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shiftEndTime">Jam Selesai *</Label>
          <Input
            id="shiftEndTime"
            type="time"
            {...register('endTime')}
            disabled={isSubmitting}
          />
          {errors.endTime && (
            <p className="text-sm text-destructive">
              {errors.endTime.message}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">Preview label shift</p>
        <p className="text-sm font-medium">{previewLabel}</p>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <Label htmlFor="shiftIsActive">Aktif</Label>
          <p className="text-xs text-muted-foreground">
            Shift aktif akan muncul pada dialog pengiriman order.
          </p>
        </div>
        <Switch
          id="shiftIsActive"
          checked={watchedIsActive}
          onCheckedChange={(checked) =>
            setValue('isActive', checked, { shouldDirty: true })
          }
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {shift ? 'Simpan Shift' : 'Tambah Shift'}
        </Button>
      </div>
    </form>
  );
}
