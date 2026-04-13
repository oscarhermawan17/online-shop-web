'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productSchema, type ProductFormData } from '@/lib/validations';
import type { Product } from '@/types';
import { useAdminCategories, useAdminUnits } from '@/hooks';

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function ProductForm({ product, onSubmit, isSubmitting }: ProductFormProps) {
  const { categories, isLoading: isLoadingCategories } = useAdminCategories();
  const { units, isLoading: isLoadingUnits } = useAdminUnits();
  const hasRealVariants = product?.variants.some((v) => !v.isDefault) ?? false;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          categoryIds: product.categories?.map((c) => c.id) || [],
          unitId: product.unitId || null,
          description: product.description || '',
          basePrice: product.basePrice,
          wholesalePrice: product.wholesalePrice ?? null,
          stock: product.stock,
        }
      : {
          name: '',
          categoryIds: [],
          unitId: null,
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Kategori</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                {isLoadingCategories ? (
                  <p className="text-sm text-muted-foreground">Memuat kategori...</p>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada kategori.</p>
                ) : (
                  <Controller
                    name="categoryIds"
                    control={control}
                    render={({ field }) => (
                      <>
                        {categories.map((category) => {
                          const isChecked = field.value?.includes(category.id);
                          return (
                            <label
                              key={category.id}
                              className="flex items-center space-x-2 text-sm cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = field.value || [];
                                  if (e.target.checked) {
                                    field.onChange([...current, category.id]);
                                  } else {
                                    field.onChange(current.filter((id) => id !== category.id));
                                  }
                                }}
                                disabled={isSubmitting}
                              />
                              <span>{category.name}</span>
                            </label>
                          );
                        })}
                      </>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="unitId">Satuan</Label>
              <Controller
                name="unitId"
                control={control}
                render={({ field }) => (
                  <Select
                    disabled={isSubmitting || isLoadingUnits}
                    onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                    value={field.value || 'none'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada satuan</SelectItem>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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
