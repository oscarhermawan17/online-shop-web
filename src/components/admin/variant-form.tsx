'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/admin/image-upload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { variantSchema, type VariantFormData } from '@/lib/validations';
import { formatRupiah } from '@/lib/utils';
import type { ProductVariant } from '@/types';
import { VariantDiscountRulesForm } from './variant-discount-rules-form';
import api from '@/lib/api';
import { toast } from 'sonner';

interface VariantFormProps {
  productId: string;
  basePrice: number;
  variants: ProductVariant[];
  onVariantsChange: () => void;
}

export function VariantForm({
  productId,
  basePrice,
  variants,
  onVariantsChange,
}: VariantFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const realVariants = variants.filter((v) => !v.isDefault);
  const isVariantManagedProduct = realVariants.length > 0;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      name: '',
      imageUrl: null,
      priceOverride: null,
      wholesalePriceOverride: null,
      stock: 0,
    },
  });

  const openAddDialog = () => {
    setEditingVariant(null);
    reset({
      name: '',
      imageUrl: null,
      priceOverride: null,
      wholesalePriceOverride: null,
      stock: 0,
    });
    setIsOpen(true);
  };

  const openEditDialog = (variant: ProductVariant) => {
    setEditingVariant(variant);
    reset({
      name: variant.name ?? undefined,
      imageUrl: variant.imageUrl ?? null,
      priceOverride: variant.priceOverride,
      wholesalePriceOverride: variant.wholesalePriceOverride,
      stock: variant.stock,
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: VariantFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        imageUrl: data.imageUrl ?? null,
        priceOverride: data.priceOverride || null,
        wholesalePriceOverride: data.wholesalePriceOverride || null,
        stock: data.stock,
      };

      if (editingVariant) {
        await api.patch(
          `/admin/products/${productId}/variants/${editingVariant.id}`,
          payload
        );
        toast.success('Varian berhasil diperbarui');
      } else {
        await api.post(`/admin/products/${productId}/variants`, payload);
        toast.success('Varian berhasil ditambahkan');
      }

      setIsOpen(false);
      reset();
      onVariantsChange();
    } catch (error: unknown) {
      console.error('Variant error:', error);
      toast.error('Gagal menyimpan varian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Yakin ingin menghapus varian ini?')) return;

    setDeletingId(variantId);
    try {
      await api.delete(`/admin/products/${productId}/variants/${variantId}`);
      toast.success('Varian berhasil dihapus');
      onVariantsChange();
    } catch (error: unknown) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus varian');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            {isVariantManagedProduct ? 'Harga dan Stok per Varian' : 'Varian Produk'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isVariantManagedProduct
              ? 'Kelola harga normal, harga retail, dan stok langsung di setiap varian.'
              : 'Tambahkan varian jika produk ini memiliki pilihan seperti warna, ukuran, atau isi.'}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Varian
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVariant ? 'Edit Varian' : 'Tambah Varian'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="variantName">Nama Varian *</Label>
                <Input
                  id="variantName"
                  placeholder="Contoh: Merah, Ukuran L, 500ml"
                  {...register('name')}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <Controller
                name="imageUrl"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Gambar Varian</Label>
                    <ImageUpload
                      images={
                        field.value
                          ? [
                              {
                                imageUrl: field.value,
                                altText: editingVariant?.name || 'Variant image',
                                sortOrder: 0,
                              },
                            ]
                          : []
                      }
                      maxImages={1}
                      onImagesChange={(images) => field.onChange(images[0]?.imageUrl ?? null)}
                    />
                    {errors.imageUrl && (
                      <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
                    )}
                  </div>
                )}
              />

              <div className="space-y-2">
                <Label htmlFor="priceOverride">
                  Harga Normal Varian (Kosongkan untuk pakai harga normal produk)
                </Label>
                <Controller
                  name="priceOverride"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="priceOverride"
                      placeholder={`Harga normal: ${formatRupiah(basePrice)}`}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors.priceOverride && (
                  <p className="text-sm text-destructive">
                    {errors.priceOverride.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wholesalePriceOverride">
                  Harga Retail Varian (Kosongkan untuk pakai harga retail produk)
                </Label>
                <Controller
                  name="wholesalePriceOverride"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="wholesalePriceOverride"
                      placeholder="Kosongkan jika sama dengan harga retail produk"
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors.wholesalePriceOverride && (
                  <p className="text-sm text-destructive">
                    {errors.wholesalePriceOverride.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="variantStock">Stok *</Label>
                <Input
                  id="variantStock"
                  type="number"
                  placeholder="0"
                  {...register('stock', { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
                {errors.stock && (
                  <p className="text-sm text-destructive">{errors.stock.message}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {editingVariant ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          {realVariants.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              Belum ada varian. Produk ini masih memakai harga dan stok utama.
            </p>
          ) : (
            <div className="space-y-3">
              {realVariants.map((variant, index) => {
                const ruleCount = variant.discountRules?.length ?? 0;

                return (
                <div
                  key={variant.id}
                  className="space-y-3 rounded-xl border-2 border-border/80 bg-background p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">Varian {index + 1}</p>
                      {variant.name?.trim() ? (
                        <Badge variant="outline" className="font-normal">
                          {variant.name}
                        </Badge>
                      ) : null}
                    </div>
                    <Badge variant={ruleCount > 0 ? 'default' : 'secondary'}>
                      {ruleCount > 0 ? `${ruleCount} rule` : 'Tanpa rule'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {variant.imageUrl ? (
                        <Image
                          src={variant.imageUrl}
                          alt={variant.name ?? 'Variant'}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-md object-cover border"
                        />
                      ) : null}
                      <div>
                      <p className="font-medium">{variant.name ?? '—'}</p>
                      <p className="text-sm text-muted-foreground">
                        Normal: {variant.priceOverride
                          ? formatRupiah(variant.priceOverride)
                          : `${formatRupiah(basePrice)} (dasar)`}
                        {' • '}
                        Retail: {variant.wholesalePriceOverride
                          ? formatRupiah(variant.wholesalePriceOverride)
                          : '(dasar)'}
                        {' • '}
                        Stok: {variant.stock}
                      </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(variant)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(variant.id)}
                        disabled={deletingId === variant.id}
                      >
                        {deletingId === variant.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <VariantDiscountRulesForm
                      productId={productId}
                      variants={variants}
                      onRulesChange={onVariantsChange}
                      embedded
                      hideHeading
                      inlineForVariant
                      onlyVariantId={variant.id}
                    />
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
