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
  shippingDriverSchema,
  type ShippingDriverFormData,
} from '@/lib/validations';
import type { ShippingDriver } from '@/types';

interface ShippingDriverFormProps {
  driver?: ShippingDriver | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (data: ShippingDriverFormData) => Promise<void>;
}

const defaultValues: ShippingDriverFormData = {
  name: '',
  isActive: true,
};

export function ShippingDriverForm({
  driver,
  isSubmitting,
  onCancel,
  onSubmit,
}: ShippingDriverFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ShippingDriverFormData>({
    resolver: zodResolver(shippingDriverSchema),
    defaultValues,
  });

  const watchedIsActive = useWatch({ control, name: 'isActive' });

  useEffect(() => {
    reset(
      driver
        ? {
            name: driver.name,
            isActive: driver.isActive,
          }
        : defaultValues,
    );
  }, [driver, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="driverName">Nama Driver / Kurir *</Label>
        <Input
          id="driverName"
          placeholder="Contoh: Pak Budi"
          {...register('name')}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <Label htmlFor="driverIsActive">Aktif</Label>
          <p className="text-xs text-muted-foreground">
            Driver aktif akan muncul pada pilihan pengiriman order.
          </p>
        </div>
        <Switch
          id="driverIsActive"
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
          {driver ? 'Simpan Driver' : 'Tambah Driver'}
        </Button>
      </div>
    </form>
  );
}
