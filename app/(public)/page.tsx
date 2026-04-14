import { Suspense } from 'react';
import {
  ProductCardSkeleton,
  CategoryHorizontalList,
  PromoProductsSection,
  PromoCarousel,
} from '@/components/public';
import { ProductGridClient } from './product-grid-client';
import type { CarouselSlide, ProductListItem } from '@/types';

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

async function getCategories(): Promise<{ id: string; name: string; icon?: string | null }[]> {
  try {
    const baseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${baseUrl}/categories`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function getCarouselSlides(): Promise<CarouselSlide[]> {
  try {
    const baseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${baseUrl}/carousel`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch carousel: ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching carousel slides:', error);
    return [];
  }
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const [products, categories, carouselSlides] = await Promise.all([
    getProducts(),
    getCategories(),
    getCarouselSlides(),
  ]);

  return (
    <div className="bg-[#f8faf8]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-16">
        <div className="flex flex-col gap-6 md:gap-8">
          {carouselSlides.length > 0 ? (
            <section>
              <PromoCarousel slides={carouselSlides} />
            </section>
          ) : null}

          {/* Category Horizontal List */}
          <section>
            <CategoryHorizontalList categories={categories} />
          </section>

          {/* Promo Products Section */}
          <section>
            <PromoProductsSection serverProducts={products} />
          </section>

          {/* All Products Grid */}
          <section id="products" className="flex flex-col gap-4">
            <h3 className="px-2 text-[#2d3432] font-bold text-lg uppercase tracking-tight">Katalog Produk</h3>
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGridClient serverProducts={products} />
            </Suspense>
          </section>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <button className="p-2 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors leading-none">‹</button>
            <button className="bg-[#166534] text-white font-bold w-10 h-10 rounded-lg flex items-center justify-center">1</button>
            {[2, 3].map((n) => (
              <button key={n} className="text-[#64748b] font-medium w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#f1f5f9] transition-colors">
                {n}
              </button>
            ))}
            <span className="text-[#94a3b8] w-10 h-10 flex items-center justify-center">...</span>
            <button className="text-[#64748b] font-medium w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#f1f5f9] transition-colors">10</button>
            <button className="p-2 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors leading-none">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
