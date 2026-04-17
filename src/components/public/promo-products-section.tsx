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
  const customerToken = useCustomerAuthStore((s) => s.token);
  const customerType = useCustomerAuthStore((s) => s.customer?.type);
  const pricingKey = customerToken ? `customer:${customerType ?? 'unknown'}` : 'guest';
  const { products: clientProducts, pagination } = useProducts({
    promoOnly: true,
    limit: 5,
  }, pricingKey);
  const canUseClientProducts = hasMounted && !!customerToken && !!pagination;

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
