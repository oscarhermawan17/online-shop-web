'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateProductForm } from '@/components/admin';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { CreateProductFormSubmitData } from '@/components/admin/create-product-form';

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateProductFormSubmitData) => {
    setIsSubmitting(true);

    try {
      const { productImages, ...payload } = data;
      const response = await api.post<{ data: { id: string } }>('/admin/products', payload);
      const productId = response.data.data.id;

      if (productImages.length > 0) {
        try {
          for (const image of productImages) {
            await api.post(`/admin/products/${productId}/images`, {
              imageUrl: image.imageUrl,
            });
          }
        } catch (imageError: unknown) {
          console.error('Create product images error:', imageError);
          toast.error('Produk dibuat, tetapi sebagian gambar gagal ditambahkan');
        }
      }

      toast.success('Produk berhasil ditambahkan');
      router.push(`/admin/products/${productId}`);
    } catch (error: unknown) {
      console.error('Create product error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menambahkan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Tambah Produk Baru</h1>
      </div>

      <div className="max-w-4xl">
        <CreateProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
