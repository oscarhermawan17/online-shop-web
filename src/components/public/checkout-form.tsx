'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import useSWR from 'swr';
import { Loader2, MapPin, Truck, Store, Check, PenLine, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkoutSchema, type CheckoutFormData } from '@/lib/validations';
import { useCustomerAuthStore } from '@/stores';
import { fetcher } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { DeliveryMethod } from '@/types';
import type { CustomerAddress } from '@/types/address';

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
  const token = useCustomerAuthStore((state) => state.token);
  const isLoggedIn = !!token && !!customer;

  // Fetch saved addresses for logged-in customers
  const { data: savedAddresses } = useSWR<CustomerAddress[]>(
    isLoggedIn ? '/customer/addresses' : null,
    fetcher,
  );

  // 'saved' = using a saved address, 'manual' = typing manually
  const [addressMode, setAddressMode] = useState<'saved' | 'manual'>('saved');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

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

  // Auto-select default address when addresses load
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [savedAddresses, selectedAddressId]);

  // When a saved address is selected, sync form values and notify parent
  useEffect(() => {
    if (addressMode !== 'saved' || !selectedAddressId || !savedAddresses) return;
    const addr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!addr) return;
    setValue('customerAddress', addr.address);
    onAddressChange?.(addr.address);
    onDistrictDetected?.(addr.district);
  }, [selectedAddressId, addressMode, savedAddresses, setValue, onAddressChange, onDistrictDetected]);

  // Stable callback for when map reverse-geocodes an address
  const handleAddressFromMap = useCallback(
    (addr: string) => setValue('customerAddress', addr),
    [setValue]
  );

  // Auto-fill when customer data is available/hydrated
  useEffect(() => {
    if (customer) {
      reset({
        customerName: customer.name || '',
        customerPhone: customer.phone || '',
        deliveryMethod: deliveryMethod,
        customerAddress: '',
      });
    }
  }, [customer, reset]);

  // Notify parent when address changes (only in manual mode)
  useEffect(() => {
    if (addressMode === 'manual') {
      onAddressChange?.(customerAddress || '');
    }
  }, [customerAddress, onAddressChange, addressMode]);

  const setDeliveryMethod = (method: DeliveryMethod) => {
    setValue('deliveryMethod', method);
    onDeliveryMethodChange?.(method);
    if (method === 'pickup') {
      setValue('customerAddress', '');
      onDistrictDetected?.(null);
    }
  };

  const handleSelectAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    setAddressMode('saved');
  };

  const handleSwitchToManual = () => {
    setAddressMode('manual');
    setSelectedAddressId(null);
    setValue('customerAddress', '');
    onDistrictDetected?.(null);
    onAddressChange?.('');
  };

  const hasSavedAddresses = isLoggedIn && savedAddresses && savedAddresses.length > 0;

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
              {/* Saved addresses for logged-in users */}
              {hasSavedAddresses && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Pilih Alamat Tersimpan</Label>
                    {addressMode === 'saved' && (
                      <button
                        type="button"
                        onClick={handleSwitchToManual}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <PenLine className="h-3 w-3" />
                        Tulis manual
                      </button>
                    )}
                    {addressMode === 'manual' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddressMode('saved');
                          const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                          setSelectedAddressId(defaultAddr.id);
                        }}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3" />
                        Pilih tersimpan
                      </button>
                    )}
                  </div>

                  {addressMode === 'saved' && (
                    <div className="space-y-2">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectAddress(addr)}
                          className={cn(
                            'w-full rounded-lg border-2 p-3 text-left transition-colors',
                            selectedAddressId === addr.id
                              ? 'border-primary bg-primary/5'
                              : 'border-muted hover:border-muted-foreground/30',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium">{addr.label}</span>
                                <span className="text-xs text-muted-foreground">{addr.phone}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {addr.recipient}
                                </Badge>
                                {addr.isDefault && (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary hover:bg-primary/10 border-0">
                                    Utama
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{addr.address}</p>
                              {addr.district && (
                                <p className="text-[10px] text-muted-foreground/70 mt-0.5">Kec. {addr.district}</p>
                              )}
                            </div>
                            {selectedAddressId === addr.id && (
                              <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                            )}
                          </div>
                        </button>
                      ))}
                      <Link
                        href="/dashboard/address"
                        className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted p-2.5 text-xs text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah alamat baru
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Manual address entry: shown for guests OR when user picks manual mode */}
              {(!hasSavedAddresses || addressMode === 'manual') && (
                <div className="space-y-3">
                  <AddressMap
                    address={customerAddress || ''}
                    onAddressFound={handleAddressFromMap}
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
