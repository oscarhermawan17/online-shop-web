'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { useAdminStore } from '@/hooks';
import { storeSchema, type StoreFormData } from '@/lib/validations';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from 'sonner';
import api from '@/lib/api';
import Image from 'next/image';
import { formatRupiah, getOptimizedImageUrl } from '@/lib/utils';

const AddressMap = dynamic(
  () => import('@/components/public/address-map'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[250px] items-center justify-center rounded-lg border bg-muted/50">
        <p className="text-sm text-muted-foreground">Memuat peta...</p>
      </div>
    ),
  }
);

const preventNegativeNumberKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['-', '+', 'e', 'E'].includes(e.key)) {
    e.preventDefault();
  }
};

const sanitizeNonNegativeNumberInput = (e: React.FormEvent<HTMLInputElement>) => {
  const target = e.currentTarget;

  if (target.value.startsWith('-')) {
    target.value = target.value.replace(/^-+/, '');
  }
};

export default function AdminStorePage() {
  const { store, isLoading, isError, mutate } = useAdminStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    values: store
      ? {
          name: store.name,
          description: store.description || '',
          address: store.address || '',
          bankName: store.bankName || '',
          bankAccountNumber: store.bankAccountNumber || '',
          bankAccountName: store.bankAccountName || '',
          qrisImageUrl: store.qrisImageUrl || '',
          deliveryRetailMinimumOrder: store.deliveryRetailMinimumOrder ?? null,
          deliveryStoreMinimumOrder: store.deliveryStoreMinimumOrder ?? null,
          deliveryRetailFreeShippingMinimumOrder: store.deliveryRetailFreeShippingMinimumOrder ?? null,
          deliveryStoreFreeShippingMinimumOrder: store.deliveryStoreFreeShippingMinimumOrder ?? null,
        }
      : undefined,
  });

  const storeAddress = watch('address');
  const deliveryRetailMinimumOrder = watch('deliveryRetailMinimumOrder');
  const deliveryStoreMinimumOrder = watch('deliveryStoreMinimumOrder');
  const deliveryRetailFreeShippingMinimumOrder = watch('deliveryRetailFreeShippingMinimumOrder');
  const deliveryStoreFreeShippingMinimumOrder = watch('deliveryStoreFreeShippingMinimumOrder');

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError || !store) {
    return (
      <ErrorMessage
        title="Gagal Memuat Data Toko"
        message="Tidak dapat memuat informasi toko"
        onRetry={() => mutate()}
      />
    );
  }

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQris(true);
    setQrisPreview(URL.createObjectURL(file));

    try {
      const result = await uploadToCloudinary(file);
      setValue('qrisImageUrl', result.secure_url);
      toast.success('QRIS berhasil diunggah');
    } catch (error) {
      console.error('QRIS upload error:', error);
      toast.error('Gagal mengunggah QRIS');
      setQrisPreview(null);
    } finally {
      setIsUploadingQris(false);
    }
  };

  const onSubmit = async (data: StoreFormData) => {
    setIsSubmitting(true);

    try {
      await api.patch('/admin/store', {
        name: data.name,
        description: data.description || undefined,
        address: data.address || undefined,
        bankName: data.bankName || undefined,
        bankAccountNumber: data.bankAccountNumber || undefined,
        bankAccountName: data.bankAccountName || undefined,
        qrisImageUrl: data.qrisImageUrl || undefined,
        deliveryRetailMinimumOrder: data.deliveryRetailMinimumOrder ?? null,
        deliveryStoreMinimumOrder: data.deliveryStoreMinimumOrder ?? null,
        deliveryRetailFreeShippingMinimumOrder: data.deliveryRetailFreeShippingMinimumOrder ?? null,
        deliveryStoreFreeShippingMinimumOrder: data.deliveryStoreFreeShippingMinimumOrder ?? null,
      });

      toast.success('Pengaturan toko berhasil disimpan');
      mutate();
      setQrisPreview(null);
    } catch (error: unknown) {
      console.error('Update store error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQrisUrl = qrisPreview || store.qrisImageUrl;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Toko</h1>
        <p className="text-muted-foreground">
          Kelola informasi dan pengaturan pembayaran toko Anda
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Toko</CardTitle>
              <CardDescription>
                Informasi dasar tentang toko Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Toko *</Label>
                <Input
                  id="name"
                  placeholder="Nama toko Anda"
                  {...register('name')}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi singkat tentang toko Anda"
                  rows={4}
                  {...register('description')}
                  disabled={isSubmitting}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Toko</Label>
                <AddressMap
                  address={storeAddress || ''}
                  onAddressFound={(addr) => setValue('address', addr)}
                  showShippingZones={false}
                />
                <Textarea
                  id="address"
                  placeholder="Alamat lengkap toko Anda"
                  rows={3}
                  {...register('address')}
                  disabled={isSubmitting}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pembayaran</CardTitle>
              <CardDescription>
                Rekening bank untuk menerima pembayaran
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Nama Bank</Label>
                <Input
                  id="bankName"
                  placeholder="Contoh: BCA, Mandiri, BNI"
                  {...register('bankName')}
                  disabled={isSubmitting}
                />
                {errors.bankName && (
                  <p className="text-sm text-destructive">
                    {errors.bankName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Nomor Rekening</Label>
                <Input
                  id="bankAccountNumber"
                  placeholder="Nomor rekening"
                  {...register('bankAccountNumber')}
                  disabled={isSubmitting}
                />
                {errors.bankAccountNumber && (
                  <p className="text-sm text-destructive">
                    {errors.bankAccountNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountName">Nama Pemilik Rekening</Label>
                <Input
                  id="bankAccountName"
                  placeholder="Nama sesuai buku rekening"
                  {...register('bankAccountName')}
                  disabled={isSubmitting}
                />
                {errors.bankAccountName && (
                  <p className="text-sm text-destructive">
                    {errors.bankAccountName.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aturan Pengiriman</CardTitle>
              <CardDescription>
                Berlaku hanya saat pelanggan memilih metode dikirim
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Minimal Belanja</h3>
                  <p className="text-sm text-muted-foreground">
                    Kosongkan jika tidak ingin membatasi checkout pengiriman.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryRetailMinimumOrder">Retail</Label>
                  <Input
                    id="deliveryRetailMinimumOrder"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    placeholder="Kosongkan jika tidak ada minimal"
                    {...register('deliveryRetailMinimumOrder', {
                      setValueAs: (v: string) => (v === '' ? null : Number(v)),
                    })}
                    onKeyDown={preventNegativeNumberKey}
                    onInput={sanitizeNonNegativeNumberInput}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Customer umum yang checkout tanpa login.
                    {typeof deliveryRetailMinimumOrder === 'number' && deliveryRetailMinimumOrder > 0
                      ? ` Aktif di ${formatRupiah(deliveryRetailMinimumOrder)}.`
                      : ' Tidak ada batas minimal aktif.'}
                  </p>
                  {errors.deliveryRetailMinimumOrder && (
                    <p className="text-sm text-destructive">
                      {errors.deliveryRetailMinimumOrder.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryStoreMinimumOrder">Toko</Label>
                  <Input
                    id="deliveryStoreMinimumOrder"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    placeholder="Kosongkan jika tidak ada minimal"
                    {...register('deliveryStoreMinimumOrder', {
                      setValueAs: (v: string) => (v === '' ? null : Number(v)),
                    })}
                    onKeyDown={preventNegativeNumberKey}
                    onInput={sanitizeNonNegativeNumberInput}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Customer login / mitra toko.
                    {typeof deliveryStoreMinimumOrder === 'number' && deliveryStoreMinimumOrder > 0
                      ? ` Aktif di ${formatRupiah(deliveryStoreMinimumOrder)}.`
                      : ' Tidak ada batas minimal aktif.'}
                  </p>
                  {errors.deliveryStoreMinimumOrder && (
                    <p className="text-sm text-destructive">
                      {errors.deliveryStoreMinimumOrder.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Minimal Belanja Free Ongkir</h3>
                  <p className="text-sm text-muted-foreground">
                    Jika subtotal produk mencapai nilai ini, ongkir akan otomatis menjadi gratis.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryRetailFreeShippingMinimumOrder">Retail</Label>
                  <Input
                    id="deliveryRetailFreeShippingMinimumOrder"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    placeholder="Kosongkan jika tidak ada free ongkir otomatis"
                    {...register('deliveryRetailFreeShippingMinimumOrder', {
                      setValueAs: (v: string) => (v === '' ? null : Number(v)),
                    })}
                    onKeyDown={preventNegativeNumberKey}
                    onInput={sanitizeNonNegativeNumberInput}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Customer umum yang checkout tanpa login.
                    {typeof deliveryRetailFreeShippingMinimumOrder === 'number' && deliveryRetailFreeShippingMinimumOrder > 0
                      ? ` Free ongkir aktif mulai ${formatRupiah(deliveryRetailFreeShippingMinimumOrder)}.`
                      : ' Free ongkir otomatis tidak aktif.'}
                  </p>
                  {errors.deliveryRetailFreeShippingMinimumOrder && (
                    <p className="text-sm text-destructive">
                      {errors.deliveryRetailFreeShippingMinimumOrder.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryStoreFreeShippingMinimumOrder">Toko</Label>
                  <Input
                    id="deliveryStoreFreeShippingMinimumOrder"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    placeholder="Kosongkan jika tidak ada free ongkir otomatis"
                    {...register('deliveryStoreFreeShippingMinimumOrder', {
                      setValueAs: (v: string) => (v === '' ? null : Number(v)),
                    })}
                    onKeyDown={preventNegativeNumberKey}
                    onInput={sanitizeNonNegativeNumberInput}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Customer login / mitra toko.
                    {typeof deliveryStoreFreeShippingMinimumOrder === 'number' && deliveryStoreFreeShippingMinimumOrder > 0
                      ? ` Free ongkir aktif mulai ${formatRupiah(deliveryStoreFreeShippingMinimumOrder)}.`
                      : ' Free ongkir otomatis tidak aktif.'}
                  </p>
                  {errors.deliveryStoreFreeShippingMinimumOrder && (
                    <p className="text-sm text-destructive">
                      {errors.deliveryStoreFreeShippingMinimumOrder.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QRIS */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>QRIS</CardTitle>
              <CardDescription>
                Upload gambar QRIS untuk pembayaran digital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                {currentQrisUrl ? (
                  <div className="relative h-48 w-48 overflow-hidden rounded-lg border bg-white p-2">
                    <Image
                      src={getOptimizedImageUrl(currentQrisUrl, 200)}
                      alt="QRIS"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                    <p className="text-sm text-muted-foreground">Belum ada QRIS</p>
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <input
                    type="hidden"
                    {...register('qrisImageUrl')}
                  />
                  <Label
                    htmlFor="qrisUpload"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 transition-colors hover:border-primary hover:bg-muted/50"
                  >
                    {isUploadingQris ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploadingQris ? 'Mengunggah...' : 'Upload QRIS'}
                  </Label>
                  <input
                    id="qrisUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleQrisUpload}
                    disabled={isUploadingQris || isSubmitting}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload gambar QRIS dari aplikasi pembayaran Anda
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Pengaturan'
          )}
        </Button>
      </form>
    </div>
  );
}
