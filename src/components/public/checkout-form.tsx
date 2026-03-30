'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkoutSchema, type CheckoutFormData } from '@/lib/validations';
import { useCustomerAuthStore } from '@/stores';

interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CheckoutForm({ onSubmit, isSubmitting }: CheckoutFormProps) {
  const customer = useCustomerAuthStore((state) => state.customer);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: customer?.name || '',
      customerPhone: customer?.phone || '',
      customerAddress: '',
    },
  });

  // Auto-fill when customer data is available/hydrated
  useEffect(() => {
    if (customer) {
      reset({
        customerName: customer.name || '',
        customerPhone: customer.phone || '',
        customerAddress: (customer as any).address || '', // Fill if it exists in the object
      });
    }
  }, [customer, reset]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Pembeli</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName">Nama Lengkap *</Label>
            <Input
              id="customerName"
              placeholder="Masukkan nama lengkap"
              {...register('customerName')}
              disabled={isSubmitting}
            />
            {errors.customerName && (
              <p className="text-sm text-destructive">{errors.customerName.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Nomor HP *</Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              {...register('customerPhone')}
              disabled={isSubmitting}
            />
            {errors.customerPhone && (
              <p className="text-sm text-destructive">{errors.customerPhone.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="customerAddress">Alamat Lengkap *</Label>
            <Textarea
              id="customerAddress"
              placeholder="Masukkan alamat lengkap (jalan, RT/RW, kelurahan, kecamatan, kota, kode pos)"
              rows={3}
              {...register('customerAddress')}
              disabled={isSubmitting}
            />
            {errors.customerAddress && (
              <p className="text-sm text-destructive">{errors.customerAddress.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Catatan tambahan untuk penjual"
              rows={2}
              {...register('notes')}
              disabled={isSubmitting}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Buat Pesanan'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
