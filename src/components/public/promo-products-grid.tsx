'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/use-products';
import { useHasMounted } from '@/hooks/use-has-mounted';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import type { PaginationMeta, ProductListItem } from '@/types';
import { ProductCard } from './product-card';
import { CatalogPagination } from './catalog-pagination';

interface PromoProductsGridProps {
  serverProducts: ProductListItem[];
  serverPagination: PaginationMeta;
}

const parsePageParam = (value: string | null) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : 1;
};

export function PromoProductsGrid({ serverProducts, serverPagination }: PromoProductsGridProps) {
  const hasMounted = useHasMounted();
  const customerToken = useCustomerAuthStore((s) => s.token);
  const customerType = useCustomerAuthStore((s) => s.customer?.type);
  const pricingKey = customerToken ? `customer:${customerType ?? 'unknown'}` : 'guest';
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get('page'));
  const { products: clientProducts, pagination: clientPagination } = useProducts({
    promoOnly: true,
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
  const promoProducts = useMemo(() => products, [products]);

  if (promoProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#757c7a]">Belum ada produk promo tersedia</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-5">
        {promoProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <CatalogPagination pagination={pagination} />
    </div>
  );
}
