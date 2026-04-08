'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { Loader2, MapPin, Truck, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkoutSchema, type CheckoutFormData } from '@/lib/validations';
import { useCustomerAuthStore } from '@/stores';
import type { DeliveryMethod } from '@/types';

const AddressMap = dynamic(
  () => import('./address-map'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[250px] items-center justify-center rounded-lg border bg-muted/50">
        <p className="text-sm text-muted-foreground">Memuat peta...</p>
      </div>
    ),
  }
);

interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => Promise<void>;
  isSubmitting: boolean;
  storeAddress?: string | null;
  storeName?: string;
  onDeliveryMethodChange?: (method: DeliveryMethod) => void;
  onAddressChange?: (address: string) => void;
  onDistrictDetected?: (district: string | null) => void;
  shippingUnavailable?: boolean;
}

export function CheckoutForm({
  onSubmit,
  isSubmitting,
  storeAddress,
  storeName,
  onDeliveryMethodChange,
  onAddressChange,
  onDistrictDetected,
  shippingUnavailable,
}: CheckoutFormProps) {
  const customer = useCustomerAuthStore((state) => state.customer);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: customer?.name || '',
      customerPhone: customer?.phone || '',
      deliveryMethod: 'pickup',
      customerAddress: '',
    },
  });

  const deliveryMethod = watch('deliveryMethod');
  const customerAddress = watch('customerAddress');

  // Auto-fill when customer data is available/hydrated
  useEffect(() => {
    if (customer) {
      reset({
        customerName: customer.name || '',
        customerPhone: customer.phone || '',
        deliveryMethod: deliveryMethod,
        customerAddress: deliveryMethod === 'delivery' ? (customer as any).address || '' : '',
      });
    }
  }, [customer, reset]);

  // Notify parent when address changes
  useEffect(() => {
    onAddressChange?.(customerAddress || '');
  }, [customerAddress, onAddressChange]);

  const setDeliveryMethod = (method: DeliveryMethod) => {
    setValue('deliveryMethod', method);
    onDeliveryMethodChange?.(method);
    if (method === 'pickup') {
      setValue('customerAddress', '');
    }
  };

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

          {/* Delivery Method */}
          <div className="space-y-3">
            <Label>Metode Pengambilan *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                disabled={isSubmitting}
                className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                  deliveryMethod === 'pickup'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <Store className={`h-5 w-5 shrink-0 ${deliveryMethod === 'pickup' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className={`font-medium ${deliveryMethod === 'pickup' ? 'text-primary' : ''}`}>Ambil di Toko</p>
                  <p className="text-xs text-muted-foreground">Pickup langsung</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                disabled={isSubmitting}
                className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                  deliveryMethod === 'delivery'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <Truck className={`h-5 w-5 shrink-0 ${deliveryMethod === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className={`font-medium ${deliveryMethod === 'delivery' ? 'text-primary' : ''}`}>Dikirim</p>
                  <p className="text-xs text-muted-foreground">Ke alamat kamu</p>
                </div>
              </button>
            </div>
          </div>

          {/* Store Location (Pickup) */}
          {deliveryMethod === 'pickup' && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{storeName || 'Lokasi Toko'}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {storeAddress || 'Alamat toko belum tersedia. Silakan hubungi toko untuk informasi lokasi.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address */}
          {deliveryMethod === 'delivery' && (
            <div className="space-y-3">
              {/* Map */}
              <AddressMap
                address={customerAddress || ''}
                onAddressFound={(addr) => setValue('customerAddress', addr)}
                onDistrictDetected={onDistrictDetected}
              />

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
          )}

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

          {shippingUnavailable && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <p className="font-medium">Pengiriman tidak tersedia</p>
              <p className="mt-0.5 text-xs text-destructive/80">
                Maaf, kami belum melayani pengiriman ke daerah Anda. Silakan pilih alamat lain atau gunakan opsi Ambil di Toko.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || shippingUnavailable}>
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
