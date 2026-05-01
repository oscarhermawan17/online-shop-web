'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CatalogPagination, ProductCard } from '@/components/public';
import { useHasMounted } from '@/hooks/use-has-mounted';
import { useProducts } from '@/hooks/use-products';
import { normalizeCategoryValues } from '@/lib/products';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import type { PaginationMeta, ProductListItem } from '@/types';

interface ProductGridClientProps {
  serverProducts: ProductListItem[];
  serverPagination: PaginationMeta;
  paginationAnchorId?: string;
}

const parseOptionalNumberParam = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

const parsePageParam = (value: string | null) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : 1;
};

export function ProductGridClient({
  serverProducts,
  serverPagination,
  paginationAnchorId,
}: ProductGridClientProps) {
  const hasMounted = useHasMounted();
  const customerToken = useCustomerAuthStore((s) => s.token);
  const customerType = useCustomerAuthStore((s) => s.customer?.type);
  const pricingKey = customerToken ? `customer:${customerType ?? 'unknown'}` : 'guest';
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q')?.trim() ?? '';
  const selectedCategory = normalizeCategoryValues(searchParams.getAll('category'));
  const minPrice = parseOptionalNumberParam(searchParams.get('minPrice'));
  const maxPrice = parseOptionalNumberParam(searchParams.get('maxPrice'));
  const page = parsePageParam(searchParams.get('page'));

  // Logged-in customers re-fetch so pricing follows the latest customer type from the backend.
  const { products: clientProducts, pagination: clientPagination } = useProducts({
    q: searchQuery,
    category: selectedCategory,
    minPrice,
    maxPrice,
    page,
    limit: serverPagination.limit,
  }, pricingKey);
  const canUseClientData = hasMounted && !!customerToken && !!clientPagination;
  const products = canUseClientData
    ? clientProducts
    : serverProducts;
  const pagination = canUseClientData
    ? clientPagination
    : serverPagination;
  const hasActiveFilters = useMemo(
    () => !!searchQuery || selectedCategory.length > 0 || minPrice !== null || maxPrice !== null,
    [searchQuery, selectedCategory, minPrice, maxPrice],
  );

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#757c7a]">
          {hasActiveFilters
            ? 'Belum ada produk yang cocok dengan pencarian atau filter'
            : 'Belum ada produk tersedia'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <CatalogPagination pagination={pagination} anchorId={paginationAnchorId} />
    </div>
  );
}
