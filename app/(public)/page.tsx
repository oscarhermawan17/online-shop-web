import { Suspense } from 'react';
import { ProductCard, ProductCardSkeleton } from '@/components/public';
import { api } from '@/lib/api';
import type { Product } from '@/types';

async function getProducts(): Promise<Product[]> {
  try {
    const response = await api.get('/products');
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

async function ProductGrid() {
  const products = await getProducts();

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Belum ada produk tersedia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 md:p-12">
        <div className="max-w-2xl">
          <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Selamat Datang di TokoKu
          </h1>
          <p className="mb-6 text-lg text-muted-foreground">
            Temukan berbagai produk berkualitas dengan harga terjangkau. 
            Belanja mudah tanpa perlu registrasi!
          </p>
          <a 
            href="#products" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Lihat Produk
          </a>
        </div>
      </section>

      {/* Products Section */}
      <section id="products">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Produk Kami</h2>
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid />
        </Suspense>
      </section>
    </div>
  );
}
