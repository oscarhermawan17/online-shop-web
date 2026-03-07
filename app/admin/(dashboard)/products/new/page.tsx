'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/admin';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { ProductFormData } from '@/lib/validations';

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      const response = await api.post<{ data: { id: string } }>('/admin/products', data);
      const productId = response.data.data.id;

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

      <div className="max-w-2xl">
        <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
