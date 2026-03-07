import { Metadata } from 'next';
import { ProductCard } from '@/components/public';
import { EmptyState } from '@/components/shared';
import type { ProductListItem } from '@/types';

export const metadata: Metadata = {
  title: 'TokoKu - Belanja Online Mudah & Terpercaya',
  description: 'Temukan berbagai produk berkualitas dengan harga terbaik. Belanja online tanpa ribet, langsung dari UMKM terpercaya.',
};

async function getProducts(): Promise<ProductListItem[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!res.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Selamat Datang di <span className="text-primary">TokoKu</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
            Temukan berbagai produk berkualitas dengan harga terbaik. 
            Belanja mudah, aman, dan terpercaya.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-2xl font-bold">Produk Kami</h2>

          {products.length === 0 ? (
            <EmptyState
              type="products"
              title="Belum Ada Produk"
              description="Produk sedang dalam persiapan. Silakan kunjungi kembali nanti."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
