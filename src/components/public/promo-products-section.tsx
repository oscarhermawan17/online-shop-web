'use client';

import { useMemo } from 'react';
import { useProducts } from '@/hooks/use-products';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import type { ProductListItem } from '@/types';
import { PromoHorizontalList } from './promo-horizontal-list';

interface PromoProductsSectionProps {
  serverProducts: ProductListItem[];
}

export function PromoProductsSection({ serverProducts }: PromoProductsSectionProps) {
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated());
  const { products: clientProducts } = useProducts();

  const products = isAuthenticated && clientProducts.length > 0
    ? clientProducts
    : serverProducts;

  const promoProducts = useMemo(
    () =>
      products
        .filter((product) => product.discount && (
          product.discount.normalDiscountActive || product.discount.retailDiscountActive
        ))
        .slice(0, 6),
    [products],
  );

  if (promoProducts.length === 0) return null;

  return <PromoHorizontalList products={promoProducts} title="🔥 Promo" />;
}
