'use client';

import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { Loader2, Upload, Store, CreditCard, Truck, MapPin, Building, Banknote, QrCode, Info, Save, Images, PlusCircle, Trash2 } from 'lucide-react';
import { CarouselManager } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { useAdminStore } from '@/hooks';
import { storeSchema, type StoreFormData } from '@/lib/validations';
import { uploadFile, confirmUpload } from '@/lib/storage';
import { toast } from 'sonner';
import api from '@/lib/api';
import Image from 'next/image';
import { formatRupiah, getOptimizedImageUrl } from '@/lib/utils';
import { BANK_NAME_OPTIONS } from '@/types/store';

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

export default function AdminStorePage() {
  const { store, isLoading, isError, mutate } = useAdminStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingBanks, setIsSavingBanks] = useState(false);
  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);

  const {
    register,
    control,
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
          bankAccounts: store.bankAccounts ?? [],
          qrisImageUrl: store.qrisImageUrl || '',
          deliveryRetailMinimumOrder: store.deliveryRetailMinimumOrder ?? null,
          deliveryStoreMinimumOrder: store.deliveryStoreMinimumOrder ?? null,
          deliveryRetailFreeShippingMinimumOrder: store.deliveryRetailFreeShippingMinimumOrder ?? null,
          deliveryStoreFreeShippingMinimumOrder: store.deliveryStoreFreeShippingMinimumOrder ?? null,
        }
      : undefined,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'bankAccounts',
  });

  const storeAddress = watch('address');
  const deliveryRetailMinimumOrder = watch('deliveryRetailMinimumOrder');
  const deliveryStoreMinimumOrder = watch('deliveryStoreMinimumOrder');
  const deliveryRetailFreeShippingMinimumOrder = watch('deliveryRetailFreeShippingMinimumOrder');
  const deliveryStoreFreeShippingMinimumOrder = watch('deliveryStoreFreeShippingMinimumOrder');

  if (isLoading) return <LoadingPage />;
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
      const { tempKey } = await uploadFile(file, 'qris');
      const { permanentUrl } = await confirmUpload(tempKey);
      setValue('qrisImageUrl', permanentUrl);
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

  const onSaveBankAccounts = async (data: StoreFormData) => {
    setIsSavingBanks(true);
    try {
      await api.put('/admin/store/bank-accounts', { bankAccounts: data.bankAccounts });
      toast.success('Rekening bank berhasil disimpan');
      mutate();
    } catch (error: unknown) {
      console.error('Update bank accounts error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan rekening bank');
    } finally {
      setIsSavingBanks(false);
    }
  };

  const currentQrisUrl = qrisPreview || store.qrisImageUrl;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan Toko</h1>
          <p className="text-muted-foreground mt-1">
            Kelola informasi dan pengaturan pembayaran toko Anda
          </p>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full sm:w-auto shadow-sm">
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />Simpan Pengaturan</>
          )}
        </Button>
      </div>

      <form id="store-form" onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="general" className="gap-2">
              <Store className="h-4 w-4" /><span className="hidden sm:inline">Umum</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="h-4 w-4" /><span className="hidden sm:inline">Pembayaran</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2">
              <Truck className="h-4 w-4" /><span className="hidden sm:inline">Pengiriman</span>
            </TabsTrigger>
            <TabsTrigger value="carousel" className="gap-2">
              <Images className="h-4 w-4" /><span className="hidden sm:inline">Carousel</span>
            </TabsTrigger>
          </TabsList>

          {/* ── General ── */}
          <TabsContent value="general" className="space-y-6">
            <Card className="border-muted shadow-sm">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5 text-primary" />Informasi Toko
                </CardTitle>
                <CardDescription>Informasi dasar tentang toko Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Toko <span className="text-destructive">*</span></Label>
                  <Input id="name" placeholder="Nama toko Anda" {...register('name')} disabled={isSubmitting} className="max-w-xl" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea id="description" placeholder="Deskripsi singkat tentang toko Anda" rows={4} {...register('description')} disabled={isSubmitting} className="resize-none" />
                  {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />Alamat Toko
                  </Label>
                  <div className="rounded-xl overflow-hidden border">
                    <AddressMap address={storeAddress || ''} onAddressFound={(addr) => setValue('address', addr)} showShippingZones={false} />
                  </div>
                  <Textarea id="address" placeholder="Alamat lengkap toko Anda" rows={3} {...register('address')} disabled={isSubmitting} className="resize-none mt-2" />
                  {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Payment ── */}
          <TabsContent value="payment" className="space-y-6">

            {/* Bank Accounts */}
            <Card className="border-muted shadow-sm">
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Banknote className="h-5 w-5 text-primary" />Rekening Bank
                    </CardTitle>
                    <CardDescription>Tambah lebih dari satu rekening untuk menerima pembayaran</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ bankName: 'BCA', accountNumber: '', accountHolder: '' })}
                    disabled={isSavingBanks}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />Tambah Rekening
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {fields.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
                    <Banknote className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">Belum ada rekening bank.</p>
                    <p className="text-xs mt-1">Klik &quot;Tambah Rekening&quot; untuk menambahkan.</p>
                  </div>
                )}

                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Rekening #{index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={isSavingBanks}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Nama Bank <span className="text-destructive">*</span></Label>
                        <Controller
                          control={control}
                          name={`bankAccounts.${index}.bankName`}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange} disabled={isSavingBanks}>
                              <SelectTrigger><SelectValue placeholder="Pilih bank" /></SelectTrigger>
                              <SelectContent>
                                {BANK_NAME_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.bankAccounts?.[index]?.bankName && (
                          <p className="text-sm text-destructive">{errors.bankAccounts[index].bankName?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Nomor Rekening <span className="text-destructive">*</span></Label>
                        <Input placeholder="Contoh: 1234567890" {...register(`bankAccounts.${index}.accountNumber`)} disabled={isSavingBanks} />
                        {errors.bankAccounts?.[index]?.accountNumber && (
                          <p className="text-sm text-destructive">{errors.bankAccounts[index].accountNumber?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Nama Pemilik Rekening <span className="text-destructive">*</span></Label>
                        <Input placeholder="Sesuai buku rekening" {...register(`bankAccounts.${index}.accountHolder`)} disabled={isSavingBanks} />
                        {errors.bankAccounts?.[index]?.accountHolder && (
                          <p className="text-sm text-destructive">{errors.bankAccounts[index].accountHolder?.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {fields.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <Button type="button" onClick={handleSubmit(onSaveBankAccounts)} disabled={isSavingBanks}>
                      {isSavingBanks
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                        : <><Save className="mr-2 h-4 w-4" />Simpan Rekening</>
                      }
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QRIS */}
            <Card className="border-muted shadow-sm">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="h-5 w-5 text-primary" />QRIS
                </CardTitle>
                <CardDescription>Upload gambar QRIS untuk pembayaran digital</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-start gap-6 sm:flex-row">
                  {currentQrisUrl ? (
                    <div className="relative h-48 w-48 overflow-hidden rounded-xl border bg-white p-2 shadow-sm shrink-0">
                      <Image src={getOptimizedImageUrl(currentQrisUrl, 200)} alt="QRIS" fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed bg-muted/50 shrink-0">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <QrCode className="h-8 w-8 opacity-50" />
                        <p className="text-sm">Belum ada QRIS</p>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 space-y-4 w-full">
                    <input type="hidden" {...register('qrisImageUrl')} />
                    <div className="max-w-md">
                      <Label htmlFor="qrisUpload" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-all hover:border-primary hover:bg-primary/5">
                        {isUploadingQris ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-sm font-medium">Mengunggah...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="rounded-full bg-primary/10 p-3"><Upload className="h-6 w-6 text-primary" /></div>
                            <div className="text-center">
                              <span className="text-sm font-medium">Klik untuk upload QRIS</span>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG atau JPEG (Maks. 5MB)</p>
                            </div>
                          </div>
                        )}
                      </Label>
                      <input id="qrisUpload" type="file" accept="image/*" onChange={handleQrisUpload} disabled={isUploadingQris || isSubmitting} className="hidden" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Shipping ── */}
          <TabsContent value="shipping" className="space-y-6">
            <Card className="border-muted shadow-sm">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-primary" />Aturan Pengiriman
                </CardTitle>
                <CardDescription>Berlaku hanya saat pelanggan memilih metode dikirim</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <div className="space-y-5">
                  <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-lg">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-sm">Minimal Belanja</h3>
                      <p className="text-sm text-muted-foreground">Kosongkan jika tidak ingin membatasi checkout pengiriman.</p>
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryRetailMinimumOrder">Customer Retail</Label>
                      <Controller name="deliveryRetailMinimumOrder" control={control} render={({ field }) => (
                        <CurrencyInput id="deliveryRetailMinimumOrder" inputMode="numeric" placeholder="Kosongkan jika tidak ada minimal" value={field.value} onValueChange={field.onChange} disabled={isSubmitting} />
                      )} />
                      <p className="text-xs text-muted-foreground">
                        {typeof deliveryRetailMinimumOrder === 'number' && deliveryRetailMinimumOrder > 0
                          ? <span className="font-medium text-primary">Aktif di {formatRupiah(deliveryRetailMinimumOrder)}</span>
                          : 'Tidak ada batas minimal aktif.'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryStoreMinimumOrder">Customer Toko</Label>
                      <Controller name="deliveryStoreMinimumOrder" control={control} render={({ field }) => (
                        <CurrencyInput id="deliveryStoreMinimumOrder" inputMode="numeric" placeholder="Kosongkan jika tidak ada minimal" value={field.value} onValueChange={field.onChange} disabled={isSubmitting} />
                      )} />
                      <p className="text-xs text-muted-foreground">
                        {typeof deliveryStoreMinimumOrder === 'number' && deliveryStoreMinimumOrder > 0
                          ? <span className="font-medium text-primary">Aktif di {formatRupiah(deliveryStoreMinimumOrder)}</span>
                          : 'Tidak ada batas minimal aktif.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-5">
                  <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-lg">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-sm">Minimal Belanja Free Ongkir</h3>
                      <p className="text-sm text-muted-foreground">Jika subtotal produk mencapai nilai ini, ongkir otomatis menjadi gratis.</p>
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryRetailFreeShippingMinimumOrder">Customer Retail</Label>
                      <Controller name="deliveryRetailFreeShippingMinimumOrder" control={control} render={({ field }) => (
                        <CurrencyInput id="deliveryRetailFreeShippingMinimumOrder" inputMode="numeric" placeholder="Kosongkan jika tidak ada free ongkir" value={field.value} onValueChange={field.onChange} disabled={isSubmitting} />
                      )} />
                      <p className="text-xs text-muted-foreground">
                        {typeof deliveryRetailFreeShippingMinimumOrder === 'number' && deliveryRetailFreeShippingMinimumOrder > 0
                          ? <span className="font-medium text-primary">Free ongkir aktif mulai {formatRupiah(deliveryRetailFreeShippingMinimumOrder)}</span>
                          : 'Free ongkir otomatis tidak aktif.'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryStoreFreeShippingMinimumOrder">Customer Toko</Label>
                      <Controller name="deliveryStoreFreeShippingMinimumOrder" control={control} render={({ field }) => (
                        <CurrencyInput id="deliveryStoreFreeShippingMinimumOrder" inputMode="numeric" placeholder="Kosongkan jika tidak ada free ongkir" value={field.value} onValueChange={field.onChange} disabled={isSubmitting} />
                      )} />
                      <p className="text-xs text-muted-foreground">
                        {typeof deliveryStoreFreeShippingMinimumOrder === 'number' && deliveryStoreFreeShippingMinimumOrder > 0
                          ? <span className="font-medium text-primary">Free ongkir aktif mulai {formatRupiah(deliveryStoreFreeShippingMinimumOrder)}</span>
                          : 'Free ongkir otomatis tidak aktif.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Carousel ── */}
          <TabsContent value="carousel" className="space-y-6">
            <CarouselManager />
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
