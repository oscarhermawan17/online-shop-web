import { Suspense } from 'react';
import { ProductCardSkeleton, PromoProductsGrid } from '@/components/public';
import { DEFAULT_PRODUCT_PAGE_LIMIT, fetchPublicProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

interface PromoPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const getSingleQueryValue = (value?: string | string[]) => (
  Array.isArray(value) ? value[0] : value
);

const parsePageQuery = (value?: string) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : 1;
};

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function PromoPage({ searchParams }: PromoPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const page = parsePageQuery(getSingleQueryValue(resolvedSearchParams.page));
  const productsResponse = await fetchPublicProducts({
    promoOnly: true,
    page,
    limit: DEFAULT_PRODUCT_PAGE_LIMIT,
  }).catch((error) => {
    console.error('Error fetching promo products:', error);
    return {
      success: false,
      message: 'Failed to fetch promo products',
      data: [],
      pagination: {
        page: 1,
        limit: DEFAULT_PRODUCT_PAGE_LIMIT,
        total: 0,
        totalPages: 1,
      },
    };
  });

  return (
    <div className="bg-[#f8faf8]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-16">
        <section className="flex flex-col gap-4">
          <h1 className="px-2 text-[#166534] font-bold text-lg uppercase tracking-tight">
            Semua Produk Promo
          </h1>
          <Suspense fallback={<ProductGridSkeleton />}>
            <PromoProductsGrid
              serverProducts={productsResponse.data}
              serverPagination={productsResponse.pagination}
            />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
