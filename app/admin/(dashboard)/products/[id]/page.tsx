'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ProductForm, VariantForm, ImageUpload, ProductDiscountRulesForm } from '@/components/admin';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { useAdminProduct } from '@/hooks';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { ProductFormData } from '@/lib/validations';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { product, isLoading, isError, mutate } = useAdminProduct(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isSyncingImages, setIsSyncingImages] = useState(false);
  const hasRealVariants = product?.variants.some((variant) => !variant.isDefault) ?? false;

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError || !product) {
    return (
      <ErrorMessage
        title="Produk Tidak Ditemukan"
        message="Produk yang Anda cari tidak ditemukan."
        onRetry={() => mutate()}
      />
    );
  }

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      await api.patch(`/admin/products/${id}`, data);
      toast.success('Produk berhasil diperbarui');
      mutate();
    } catch (error: unknown) {
      console.error('Update product error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal memperbarui produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    setIsTogglingActive(true);

    try {
      await api.patch(`/admin/products/${id}`, { isActive: !product.isActive });
      toast.success(
        product.isActive ? 'Produk dinonaktifkan' : 'Produk diaktifkan'
      );
      mutate();
    } catch (error: unknown) {
      console.error('Toggle active error:', error);
      toast.error('Gagal mengubah status produk');
    } finally {
      setIsTogglingActive(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    setIsDeleting(true);

    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Produk berhasil dihapus');
      router.push('/admin/products');
    } catch (error: unknown) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus produk');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImagesChange = async (
    images: { id?: string; imageUrl: string; altText?: string; sortOrder: number; isNew?: boolean }[]
  ) => {
    if (isSyncingImages) return;

    setIsSyncingImages(true);

    try {
      const existingImages = product.images;
      const existingIds = existingImages.map((img) => img.id);
      const nextExistingIds = images
        .map((img) => img.id)
        .filter((imgId): imgId is string => Boolean(imgId));

      const sameExistingSet =
        existingIds.length === nextExistingIds.length &&
        existingIds.every((imgId) => nextExistingIds.includes(imgId));
      const isReordered =
        sameExistingSet && existingIds.some((imgId, index) => nextExistingIds[index] !== imgId);

      // Backend belum punya endpoint update order, jadi reorder disimpan dengan recreate.
      if (isReordered) {
        for (const existingImage of existingImages) {
          await api.delete(`/admin/products/${id}/images/${existingImage.id}`);
        }

        for (const image of images) {
          await api.post(`/admin/products/${id}/images`, {
            imageUrl: image.imageUrl,
          });
        }

        toast.success('Urutan gambar berhasil diperbarui');
        await mutate();
        return;
      }

      const nextExistingIdSet = new Set(nextExistingIds);
      const removedImages = existingImages.filter((img) => !nextExistingIdSet.has(img.id));
      const newImages = images.filter((img) => !img.id || img.isNew);

      for (const removedImage of removedImages) {
        await api.delete(`/admin/products/${id}/images/${removedImage.id}`);
      }

      for (const newImage of newImages) {
        await api.post(`/admin/products/${id}/images`, {
          imageUrl: newImage.imageUrl,
        });
      }

      if (removedImages.length > 0 || newImages.length > 0) {
        toast.success('Gambar produk berhasil diperbarui');
      }

      await mutate();
    } catch (error: unknown) {
      console.error('Sync images error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal memperbarui gambar produk');
      await mutate();
    } finally {
      setIsSyncingImages(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Produk</h1>
            {hasRealVariants && (
              <p className="text-sm text-muted-foreground">
                Produk ini memakai model harga dan stok per varian.
              </p>
            )}
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Hapus
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Product Form */}
          <ProductForm
            product={product}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

          {/* Status Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Produk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Produk Aktif</Label>
                  <p className="text-sm text-muted-foreground">
                    Produk aktif akan ditampilkan di halaman publik
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={product.isActive}
                  onCheckedChange={handleToggleActive}
                  disabled={isTogglingActive}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gambar Produk</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                images={product.images.map((img) => ({
                  id: img.id,
                  imageUrl: img.imageUrl,
                  altText: img.altText || undefined,
                  sortOrder: img.sortOrder,
                }))}
                onImagesChange={handleImagesChange}
                disabled={isSyncingImages}
              />
            </CardContent>
          </Card>

          {/* Variants */}
          <ProductDiscountRulesForm
            productId={id}
            rules={product.productDiscountRules ?? []}
            variants={product.variants}
            onRulesChange={() => mutate()}
          />

          {/* Variants */}
          <VariantForm
            productId={id}
            basePrice={product.basePrice}
            variants={product.variants}
            onVariantsChange={() => mutate()}
          />
        </div>
      </div>
    </div>
  );
}
