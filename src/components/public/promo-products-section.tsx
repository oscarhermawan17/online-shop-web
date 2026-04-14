'use client';

import { useMemo } from 'react';
import { useProducts } from '@/hooks/use-products';
import { useHasMounted } from '@/hooks/use-has-mounted';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import type { ProductListItem } from '@/types';
import { PromoHorizontalList } from './promo-horizontal-list';

interface PromoProductsSectionProps {
  serverProducts: ProductListItem[];
}

export function PromoProductsSection({ serverProducts }: PromoProductsSectionProps) {
  const hasMounted = useHasMounted();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated());
  const { products: clientProducts, pagination } = useProducts({
    promoOnly: true,
    limit: 5,
  });
  const canUseClientProducts = hasMounted && isAuthenticated && !!pagination;

  const products = canUseClientProducts
    ? clientProducts
    : serverProducts;

  const promoProducts = useMemo(
    () => products.slice(0, 5),
    [products],
  );

  if (promoProducts.length === 0) return null;

  return <PromoHorizontalList products={promoProducts} title="🔥 Promo" />;
}
