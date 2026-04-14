import { Suspense } from 'react';
import {
  ProductCardSkeleton,
  CategoryFilterSidebar,
  PriceRangeFilter,
} from '@/components/public';
import { ProductGridClient } from '../product-grid-client';
import type { ProductListItem } from '@/types';

export const dynamic = 'force-dynamic';

interface CatalogPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const getSingleQueryValue = (value?: string | string[]) => (
  Array.isArray(value) ? value[0] : value
);

async function getProducts(query?: string): Promise<ProductListItem[]> {
  try {
    const baseUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
    const params = new URLSearchParams();

    if (query?.trim()) {
      params.set('q', query.trim());
    }

    const queryString = params.toString();
    const url = queryString ? `${baseUrl}/products?${queryString}` : `${baseUrl}/products`;
    const res = await fetch(url, { cache: 'no-store' });
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

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const searchQuery = getSingleQueryValue(resolvedSearchParams.q)?.trim() ?? '';
  const [products, categories] = await Promise.all([getProducts(searchQuery), getCategories()]);

  return (
    <div className="bg-[#f8faf8]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-16 flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:flex flex-col gap-8 w-64 shrink-0">
          <div className="flex flex-col gap-4">
            <h2 className="text-[#2d3432] text-lg font-bold">Refine Search</h2>
            <CategoryFilterSidebar categories={categories} />
            <PriceRangeFilter />
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <section className="flex flex-col gap-4">
            <div className="px-2 flex flex-col gap-1">
              <h1 className="text-[#2d3432] font-bold text-lg uppercase tracking-tight">
                Katalog Produk
              </h1>
              {searchQuery ? (
                <p className="text-sm text-[#64748b]">
                  Hasil pencarian untuk &quot;{searchQuery}&quot;
                </p>
              ) : null}
            </div>
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGridClient serverProducts={products} />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}
