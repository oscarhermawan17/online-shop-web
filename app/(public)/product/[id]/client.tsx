'use client';

import { useState } from 'react';
import { VariantSelector, AddToCartButton } from '@/components/public';
import { formatRupiah } from '@/lib/utils';
import { useProduct } from '@/hooks/use-products';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import type { Product } from '@/types';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product: serverProduct }: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated());

  // Re-fetch with customer auth to get wholesale prices when logged in
  const { product: clientProduct } = useProduct(isAuthenticated ? serverProduct.id : null);
  const product = clientProduct ?? serverProduct;

  const hasVariants = product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants.find((v) => v.id === selectedVariantId) || null
    : null;

  // Use resolved price from public API (already accounts for variant override, wholesale, discount)
  const currentPrice = selectedVariant?.price ?? product.basePrice;

  return (
    <>
      {/* Price */}
      <div className="space-y-1">
        <p className="text-3xl font-bold text-primary">
          {formatRupiah(currentPrice)}
          <span className="text-lg font-normal text-muted-foreground ml-2">
            / {product.unit?.name || 'pcs'}
          </span>
        </p>
        {selectedVariant?.price && selectedVariant.price !== product.basePrice && (
          <p className="text-sm text-muted-foreground line-through">
            {formatRupiah(product.basePrice)}
          </p>
        )}
      </div>

      {/* Variant Selector */}
      {hasVariants && (
        <VariantSelector
          variants={product.variants}
          basePrice={product.basePrice}
          selectedVariantId={selectedVariantId}
          onSelect={setSelectedVariantId}
        />
      )}

      {/* Add to Cart */}
      <AddToCartButton
        product={product}
        selectedVariant={selectedVariant}
      />
    </>
  );
}
