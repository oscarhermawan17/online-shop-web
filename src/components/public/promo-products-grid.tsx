'use client';

import { useMemo } from 'react';
import { useProducts } from '@/hooks/use-products';
import { useHasMounted } from '@/hooks/use-has-mounted';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import type { ProductListItem } from '@/types';
import { ProductCard } from './product-card';

interface PromoProductsGridProps {
  serverProducts: ProductListItem[];
}

export function PromoProductsGrid({ serverProducts }: PromoProductsGridProps) {
  const hasMounted = useHasMounted();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated());
  const { products: clientProducts } = useProducts();
  const canUseClientProducts = hasMounted && isAuthenticated && clientProducts.length > 0;

  const products = canUseClientProducts
    ? clientProducts
    : serverProducts;

  const promoProducts = useMemo(
    () =>
      products.filter((product) => product.discount && (
        product.discount.normalDiscountActive || product.discount.retailDiscountActive
      )),
    [products],
  );

  if (promoProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#757c7a]">Belum ada produk promo tersedia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-5">
      {promoProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
