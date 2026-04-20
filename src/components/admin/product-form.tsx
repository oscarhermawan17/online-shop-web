'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
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
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryToAdd, setCategoryToAdd] = useState<string | undefined>(undefined);
  const normalizedCategorySearch = categorySearch.trim().toLowerCase();
  const hasRealVariants = product?.variants.some((v) => !v.isDefault) ?? false;
  const isVariantManagedProduct = Boolean(product && hasRealVariants);

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
        <CardTitle>
          {product
            ? isVariantManagedProduct
              ? 'Informasi Produk'
              : 'Edit Produk'
            : 'Tambah Produk Baru'}
        </CardTitle>
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
              <div className="space-y-2 border rounded-md p-3">
                {isLoadingCategories ? (
                  <p className="text-sm text-muted-foreground">Memuat kategori...</p>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada kategori.</p>
                ) : (
                  <Controller
                    name="categoryIds"
                    control={control}
                    render={({ field }) => {
                      const selectedCategoryIds = field.value || [];
                      const availableCategories = categories.filter(
                        (category) => !selectedCategoryIds.includes(category.id)
                      );
                      const filteredAvailableCategories = availableCategories.filter((category) =>
                        category.name.toLowerCase().includes(normalizedCategorySearch)
                      );

                      return (
                        <div className="space-y-2">
                          <Select
                            disabled={isSubmitting}
                            onOpenChange={(open) => {
                              if (!open) {
                                setCategorySearch('');
                              }
                            }}
                            onValueChange={(value) => {
                              if (!selectedCategoryIds.includes(value)) {
                                field.onChange([...selectedCategoryIds, value]);
                              }
                              setCategorySearch('');
                              setCategoryToAdd(undefined);
                            }}
                            value={categoryToAdd}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                              <div className="border-b p-2">
                                <Input
                                  placeholder="Cari kategori..."
                                  value={categorySearch}
                                  onChange={(e) => setCategorySearch(e.target.value)}
                                  onKeyDown={(e) => e.stopPropagation()}
                                  disabled={isSubmitting}
                                />
                              </div>
                              {filteredAvailableCategories.length === 0 ? (
                                <div className="px-2 py-3 text-sm text-muted-foreground">Kategori tidak ditemukan.</div>
                              ) : (
                                filteredAvailableCategories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>

                          {selectedCategoryIds.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {selectedCategoryIds.map((categoryId) => {
                                const selectedCategory = categories.find((c) => c.id === categoryId);

                                if (!selectedCategory) {
                                  return null;
                                }

                                return (
                                  <div
                                    key={categoryId}
                                    className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs"
                                  >
                                    <span>{selectedCategory.name}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 rounded-full"
                                      aria-label={`Hapus kategori ${selectedCategory.name}`}
                                      onClick={() =>
                                        field.onChange(selectedCategoryIds.filter((id) => id !== categoryId))
                                      }
                                      disabled={isSubmitting}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Belum ada kategori dipilih.</p>
                          )}
                        </div>
                      );
                    }}
                  />
                )}
              </div>
              {errors.categoryIds && (
                <p className="text-sm text-destructive">{errors.categoryIds.message}</p>
              )}
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
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

          {isVariantManagedProduct ? (
            <div className="space-y-2">
              <div className="rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                Harga normal, harga retail, dan stok untuk produk ini dikelola per varian.
                Gunakan panel <span className="font-medium text-foreground">Varian Produk</span>
                {' '}untuk memperbarui harga dan stok.
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="basePrice">Harga Normal (Rp) *</Label>
                <Controller
                  name="basePrice"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="basePrice"
                      placeholder="Rp 0"
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? 0)}
                      disabled={isSubmitting}
                    />
                  )}
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

              <div className="space-y-2">
                <Label htmlFor="wholesalePrice">Harga Retail (Rp)</Label>
                <Controller
                  name="wholesalePrice"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="wholesalePrice"
                      placeholder="Kosongkan jika sama dengan harga normal"
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  )}
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
            </>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : product ? (
              isVariantManagedProduct ? 'Simpan Informasi Produk' : 'Simpan Perubahan'
            ) : (
              'Tambah Produk'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
