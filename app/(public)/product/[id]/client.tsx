'use client';

import { useState } from 'react';
import { ProductGallery, VariantSelector, AddToCartButton } from '@/components/public';
import { useHasMounted } from '@/hooks/use-has-mounted';
import { formatRupiah } from '@/lib/utils';
import { useProduct } from '@/hooks/use-products';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import type { Product } from '@/types';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product: serverProduct }: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const hasMounted = useHasMounted();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated());
  const shouldFetchCustomerProduct = hasMounted && isAuthenticated;

  // Re-fetch with customer auth to get wholesale prices when logged in
  const { product: clientProduct } = useProduct(shouldFetchCustomerProduct ? serverProduct.id : null);
  const product = clientProduct ?? serverProduct;

  const hasVariants = product.variants.length > 0;
  const effectiveSelectedVariantId = hasVariants
    ? product.variants.some((variant) => variant.id === selectedVariantId)
      ? selectedVariantId
      : product.variants[0]?.id ?? null
    : null;
  const selectedVariant = hasVariants
    ? product.variants.find((variant) => variant.id === effectiveSelectedVariantId) ?? null
    : null;
  // const shouldShowVariantSelector = product.variants.length > 1;

  // Use resolved price from public API (already accounts for variant override, wholesale, discount)
  const currentPrice = selectedVariant?.price ?? product.basePrice;
  const originalPrice =
    selectedVariant?.price && selectedVariant.price !== product.basePrice
      ? formatRupiah(product.basePrice)
      : null;

  return (
    <>
      <ProductGallery
        images={product.images}
        productName={product.name}
        selectedImageUrl={selectedVariant?.imageUrl ?? null}
        selectedImageAlt={selectedVariant?.name ?? product.name}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>
          {product.description && (
            <p className="mt-4 text-muted-foreground">{product.description}</p>
          )}
        </div>

        <div className="space-y-1 min-h-18">
          <p className="text-3xl font-bold text-primary">
            {formatRupiah(currentPrice)}
            <span className="ml-2 text-lg font-normal text-muted-foreground">
              / {product.unit?.name || 'pcs'}
            </span>
          </p>
          <p
            className={`text-sm leading-5 ${originalPrice ? 'text-muted-foreground line-through' : 'invisible'}`}
            aria-hidden={!originalPrice}
          >
            {originalPrice ?? formatRupiah(product.basePrice)}
          </p>
        </div>

          <VariantSelector
            variants={product.variants}
            basePrice={product.basePrice}
            selectedVariantId={effectiveSelectedVariantId}
            onSelect={setSelectedVariantId}
          />

        <AddToCartButton
          product={product}
          selectedVariant={selectedVariant}
        />
      </div>
    </>
  );
}
