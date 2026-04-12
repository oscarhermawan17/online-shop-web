'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productSchema, type ProductFormData } from '@/lib/validations';
import type { Product } from '@/types';

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function ProductForm({ product, onSubmit, isSubmitting }: ProductFormProps) {
  const hasRealVariants = product?.variants.some((v) => !v.isDefault) ?? false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || '',
          basePrice: product.basePrice,
          wholesalePrice: product.wholesalePrice ?? null,
          stock: product.stock,
        }
      : {
          name: '',
          description: '',
          basePrice: 0,
          wholesalePrice: null,
          stock: 0,
        },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? 'Edit Produk' : 'Tambah Produk Baru'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk *</Label>
            <Input
              id="name"
              placeholder="Masukkan nama produk"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Deskripsi produk"
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

          {/* Retail Price */}
          <div className="space-y-2">
            <Label htmlFor="basePrice">Harga Normal (Rp) *</Label>
            <Input
              id="basePrice"
              type="number"
              placeholder="0"
              {...register('basePrice', { valueAsNumber: true })}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Harga untuk semua customer (termasuk guest / tidak login)
            </p>
            {errors.basePrice && (
              <p className="text-sm text-destructive">
                {errors.basePrice.message}
              </p>
            )}
          </div>

          {/* Wholesale Price */}
          <div className="space-y-2">
            <Label htmlFor="wholesalePrice">Harga Retail (Rp)</Label>
            <Input
              id="wholesalePrice"
              type="number"
              placeholder="Kosongkan jika sama dengan harga normal"
              {...register('wholesalePrice', {
                setValueAs: (v: string) => {
                  if (v === '' || v === undefined || v === null) return null;
                  const n = Number(v);
                  return isNaN(n) ? null : n;
                },
              })}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Harga untuk customer ritel (login). Kosongkan jika sama dengan harga normal.
            </p>
            {errors.wholesalePrice && (
              <p className="text-sm text-destructive">
                {errors.wholesalePrice.message}
              </p>
            )}
          </div>

          {/* Stock — hidden when real variants exist */}
          {!hasRealVariants && (
            <div className="space-y-2">
              <Label htmlFor="stock">Stok *</Label>
              <Input
                id="stock"
                type="number"
                placeholder="0"
                {...register('stock', { valueAsNumber: true })}
                disabled={isSubmitting}
              />
              {errors.stock && (
                <p className="text-sm text-destructive">{errors.stock.message}</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : product ? (
              'Simpan Perubahan'
            ) : (
              'Tambah Produk'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
