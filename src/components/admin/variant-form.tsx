'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      name: '',
      priceOverride: null,
      wholesalePriceOverride: null,
      stock: 0,
    },
  });

  const openAddDialog = () => {
    setEditingVariant(null);
    reset({ name: '', priceOverride: null, wholesalePriceOverride: null, stock: 0 });
    setIsOpen(true);
  };

  const openEditDialog = (variant: ProductVariant) => {
    setEditingVariant(variant);
    reset({
      name: variant.name ?? undefined,
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
        <CardTitle className="text-lg">Varian Produk</CardTitle>
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

              <div className="space-y-2">
                <Label htmlFor="priceOverride">
                  Harga Retail Varian (Kosongkan untuk pakai harga retail produk)
                </Label>
                <Input
                  id="priceOverride"
                  type="number"
                  placeholder={`Harga retail: ${formatRupiah(basePrice)}`}
                  {...register('priceOverride', {
                    setValueAs: (v) => (v === '' ? null : Number(v)),
                  })}
                  disabled={isSubmitting}
                />
                {errors.priceOverride && (
                  <p className="text-sm text-destructive">
                    {errors.priceOverride.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wholesalePriceOverride">
                  Harga Toko Varian (Kosongkan untuk pakai harga toko produk)
                </Label>
                <Input
                  id="wholesalePriceOverride"
                  type="number"
                  placeholder="Kosongkan jika sama dengan harga toko produk"
                  {...register('wholesalePriceOverride', {
                    setValueAs: (v) => (v === '' ? null : Number(v)),
                  })}
                  disabled={isSubmitting}
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
      <CardContent>
        {realVariants.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            Belum ada varian. Tambahkan varian jika produk ini memiliki pilihan
            seperti warna, ukuran, dll.
          </p>
        ) : (
          <div className="space-y-2">
            {realVariants.map((variant) => (
              <div
                key={variant.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{variant.name ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">
                    Retail: {variant.priceOverride
                      ? formatRupiah(variant.priceOverride)
                      : `${formatRupiah(basePrice)} (dasar)`}
                    {' • '}
                    Toko: {variant.wholesalePriceOverride
                      ? formatRupiah(variant.wholesalePriceOverride)
                      : '(dasar)'}
                    {' • '}
                    Stok: {variant.stock}
                  </p>
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
