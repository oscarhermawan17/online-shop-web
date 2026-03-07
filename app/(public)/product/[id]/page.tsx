import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductGallery, VariantSelector, AddToCartButton } from '@/components/public';
import { formatRupiah, getEffectivePrice } from '@/lib/utils';
import type { Product } from '@/types';
import { ProductDetailClient } from './client';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan',
    };
  }

  return {
    title: `${product.name} | TokoKu`,
    description: product.description || `Beli ${product.name} dengan harga terbaik di TokoKu`,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images?.[0]?.imageUrl ? [product.images[0].imageUrl] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image Gallery */}
        <ProductGallery images={product.images} productName={product.name} />

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>
            {product.description && (
              <p className="mt-4 text-muted-foreground">{product.description}</p>
            )}
          </div>

          {/* Client-side interactive part */}
          <ProductDetailClient product={product} />
        </div>
      </div>
    </div>
  );
}
