'use client';

import { useState } from 'react';
import { VariantSelector, AddToCartButton } from '@/components/public';
import { formatRupiah, getEffectivePrice } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const hasVariants = product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants.find((v) => v.id === selectedVariantId) || null
    : null;

  const currentPrice = getEffectivePrice(
    product.basePrice,
    selectedVariant?.priceOverride
  );

  return (
    <>
      {/* Price */}
      <div className="space-y-1">
        <p className="text-3xl font-bold text-primary">
          {formatRupiah(currentPrice)}
        </p>
        {selectedVariant?.priceOverride &&
          selectedVariant.priceOverride !== product.basePrice && (
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
