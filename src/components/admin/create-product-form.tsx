'use client';

import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/image-upload';
import { createProductSchema, type CreateProductFormData } from '@/lib/validations';
import { useAdminCategories, useAdminUnits } from '@/hooks';

interface CreateProductFormProps {
  onSubmit: (data: CreateProductFormData) => Promise<void>;
  isSubmitting: boolean;
}

const emptyVariant = {
  name: '',
  imageUrl: null as string | null,
  basePrice: 0,
  wholesalePrice: null as number | null,
  stock: 0,
};

export function CreateProductForm({
  onSubmit,
  isSubmitting,
}: CreateProductFormProps) {
  const { categories, isLoading: isLoadingCategories } = useAdminCategories();
  const { units, isLoading: isLoadingUnits } = useAdminUnits();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      categoryIds: [],
      unitId: null,
      description: '',
      variants: [emptyVariant],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });
  const variants = useWatch({
    control,
    name: 'variants',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah Produk Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
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
                              className="flex cursor-pointer items-center space-x-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = field.value || [];
                                  if (e.target.checked) {
                                    field.onChange([...current, category.id]);
                                    return;
                                  }

                                  field.onChange(current.filter((id) => id !== category.id));
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
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

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
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Varian Produk</h2>
                <p className="text-sm text-muted-foreground">
                  Input harga normal, harga retail, dan stok langsung per varian.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => append(emptyVariant)}
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Varian
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Varian pertama dipakai sebagai harga dasar produk untuk tampilan umum dan halaman edit.
            </p>

            {fields.map((field, index) => {
              const variantErrors = errors.variants?.[index];
              const requiresName = fields.length > 1;

              return (
                <div key={field.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Varian {index + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        {index === 0
                          ? 'Varian dasar produk'
                          : 'Varian tambahan'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={isSubmitting || fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variants.${index}.name`}>
                      Nama Varian {requiresName ? '*' : ''}
                    </Label>
                    <Input
                      id={`variants.${index}.name`}
                      placeholder={
                        requiresName
                          ? 'Contoh: Merah, Ukuran L, 500ml'
                          : 'Opsional jika hanya satu varian'
                      }
                      {...register(`variants.${index}.name`)}
                      disabled={isSubmitting}
                    />
                    {variantErrors?.name && (
                      <p className="text-sm text-destructive">
                        {variantErrors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Gambar Varian</Label>
                    <ImageUpload
                      images={
                        variants?.[index]?.imageUrl
                          ? [
                              {
                                imageUrl: variants[index].imageUrl!,
                                altText: variants[index].name || `Varian ${index + 1}`,
                                sortOrder: 0,
                              },
                            ]
                          : []
                      }
                      maxImages={1}
                      onImagesChange={(images) => {
                        const imageUrl = images[0]?.imageUrl ?? null;
                        setValue(`variants.${index}.imageUrl`, imageUrl, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                    {variantErrors?.imageUrl && (
                      <p className="text-sm text-destructive">
                        {variantErrors.imageUrl.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`variants.${index}.basePrice`}>
                        Harga Normal (Rp) *
                      </Label>
                      <Controller
                        name={`variants.${index}.basePrice`}
                        control={control}
                        render={({ field }) => (
                          <CurrencyInput
                            id={`variants.${index}.basePrice`}
                            placeholder="Rp 0"
                            value={field.value}
                            onValueChange={(value) => field.onChange(value ?? 0)}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                      {variantErrors?.basePrice && (
                        <p className="text-sm text-destructive">
                          {variantErrors.basePrice.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`variants.${index}.wholesalePrice`}>
                        Harga Retail (Rp)
                      </Label>
                      <Controller
                        name={`variants.${index}.wholesalePrice`}
                        control={control}
                        render={({ field }) => (
                          <CurrencyInput
                            id={`variants.${index}.wholesalePrice`}
                            placeholder="Kosongkan jika sama dengan harga normal"
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                      {variantErrors?.wholesalePrice && (
                        <p className="text-sm text-destructive">
                          {variantErrors.wholesalePrice.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`variants.${index}.stock`}>Stok *</Label>
                      <Input
                        id={`variants.${index}.stock`}
                        type="number"
                        placeholder="0"
                        {...register(`variants.${index}.stock`, {
                          valueAsNumber: true,
                        })}
                        disabled={isSubmitting}
                      />
                      {variantErrors?.stock && (
                        <p className="text-sm text-destructive">
                          {variantErrors.stock.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {typeof errors.variants?.message === 'string' && (
              <p className="text-sm text-destructive">{errors.variants.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Tambah Produk'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
