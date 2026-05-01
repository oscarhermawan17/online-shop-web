import { Suspense } from 'react';
import {
  ProductCardSkeleton,
  CategoryHorizontalList,
  PromoProductsSection,
  PromoCarousel,
} from '@/components/public';
import { ProductGridClient } from './product-grid-client';
import { DEFAULT_PRODUCT_PAGE_LIMIT, fetchPublicProducts, normalizeCategoryValues } from '@/lib/products';
import type { CarouselSlide } from '@/types';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const getSingleQueryValue = (value?: string | string[]) => (
  Array.isArray(value) ? value[0] : value
);

const parseOptionalNumberQuery = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

const parsePageQuery = (value?: string) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : 1;
};

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

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const q = getSingleQueryValue(resolvedSearchParams.q)?.trim() ?? '';
  const category = normalizeCategoryValues(resolvedSearchParams.category);
  const minPrice = parseOptionalNumberQuery(getSingleQueryValue(resolvedSearchParams.minPrice));
  const maxPrice = parseOptionalNumberQuery(getSingleQueryValue(resolvedSearchParams.maxPrice));
  const page = parsePageQuery(getSingleQueryValue(resolvedSearchParams.page));

  const [productsResponse, promoProductsResponse, categories, carouselSlides] = await Promise.all([
    fetchPublicProducts({
      q,
      category,
      minPrice,
      maxPrice,
      page,
      limit: DEFAULT_PRODUCT_PAGE_LIMIT,
    }).catch((error) => {
      console.error('Error fetching products:', error);
      return {
        success: false,
        message: 'Failed to fetch products',
        data: [],
        pagination: {
          page: 1,
          limit: DEFAULT_PRODUCT_PAGE_LIMIT,
          total: 0,
          totalPages: 1,
        },
      };
    }),
    fetchPublicProducts({
      promoOnly: true,
      limit: 5,
    }).catch((error) => {
      console.error('Error fetching promo products:', error);
      return {
        success: false,
        message: 'Failed to fetch promo products',
        data: [],
        pagination: {
          page: 1,
          limit: 5,
          total: 0,
          totalPages: 1,
        },
      };
    }),
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
            <PromoProductsSection serverProducts={promoProductsResponse.data} />
          </section>

          {/* All Products Grid */}
          <section id="products" className="flex flex-col gap-4">
            <h3 className="px-2 text-[#2d3432] font-bold text-lg uppercase tracking-tight">Katalog Produk</h3>
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGridClient
                serverProducts={productsResponse.data}
                serverPagination={productsResponse.pagination}
                paginationAnchorId="products"
              />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}
