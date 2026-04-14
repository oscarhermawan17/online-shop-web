import { Suspense } from 'react';
import { ProductCardSkeleton, PromoProductsGrid } from '@/components/public';
import type { ProductListItem } from '@/types';

export const dynamic = 'force-dynamic';

async function getProducts(): Promise<ProductListItem[]> {
  try {
    const baseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${baseUrl}/products`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function PromoPage() {
  const products = await getProducts();

  return (
    <div className="bg-[#f8faf8]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-16">
        <section className="flex flex-col gap-4">
          <h1 className="px-2 text-[#166534] font-bold text-lg uppercase tracking-tight">
            Semua Produk Promo
          </h1>
          <Suspense fallback={<ProductGridSkeleton />}>
            <PromoProductsGrid serverProducts={products} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
