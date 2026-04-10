'use client';

import { ProductCard } from '@/components/public';
import { useProducts } from '@/hooks/use-products';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import type { ProductListItem } from '@/types';

interface ProductGridClientProps {
  serverProducts: ProductListItem[];
}

export function ProductGridClient({ serverProducts }: ProductGridClientProps) {
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated());

  // Re-fetch with customer auth to get wholesale prices when logged in
  const { products: clientProducts } = useProducts();
  const products = isAuthenticated && clientProducts.length > 0
    ? clientProducts
    : serverProducts;

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#757c7a]">Belum ada produk tersedia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
