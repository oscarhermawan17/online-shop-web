'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/public';
import { useProducts } from '@/hooks/use-products';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import type { ProductListItem } from '@/types';

interface ProductGridClientProps {
  serverProducts: ProductListItem[];
}

export function ProductGridClient({ serverProducts }: ProductGridClientProps) {
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated());
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category')?.trim().toLowerCase();
  const minPrice = Number(searchParams.get('minPrice') || '') || null;
  const maxPrice = Number(searchParams.get('maxPrice') || '') || null;

  // Re-fetch with customer auth to get wholesale prices when logged in
  const { products: clientProducts } = useProducts();
  const products = isAuthenticated && clientProducts.length > 0
    ? clientProducts
    : serverProducts;
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !selectedCategory || product.categories?.some(
        (category) => category.name.trim().toLowerCase() === selectedCategory,
      );

      if (!matchesCategory) {
        return false;
      }

      const variantPrices = product.variants
        .map((variant) => variant.price ?? variant.priceOverride ?? product.basePrice)
        .filter((price): price is number => typeof price === 'number');
      const allPrices = variantPrices.length > 0
        ? [product.basePrice, ...variantPrices]
        : [product.basePrice];
      const productMinPrice = Math.min(...allPrices);
      const productMaxPrice = Math.max(...allPrices);

      if (minPrice !== null && productMaxPrice < minPrice) {
        return false;
      }

      if (maxPrice !== null && productMinPrice > maxPrice) {
        return false;
      }

      return true;
    });
  }, [products, selectedCategory, minPrice, maxPrice]);

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#757c7a]">
          {selectedCategory || minPrice !== null || maxPrice !== null
            ? 'Belum ada produk yang sesuai filter'
            : 'Belum ada produk tersedia'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-5">
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
