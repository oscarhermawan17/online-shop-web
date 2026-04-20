'use client';

import { useEffect, useState } from 'react';
import { ProductGallery, VariantSelector, AddToCartButton } from '@/components/public';
import { useHasMounted } from '@/hooks/use-has-mounted';
import { formatRupiah } from '@/lib/utils';
import { useProduct } from '@/hooks/use-products';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import type { Product } from '@/types';
import { inferVariantRawUnitPrice, resolveVariantDiscount } from '@/lib/variant-discount';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product: serverProduct }: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const hasMounted = useHasMounted();
  const customerToken = useCustomerAuthStore((s) => s.token);
  const customerType = useCustomerAuthStore((s) => s.customer?.type);
  const pricingKey = customerToken ? `customer:${customerType ?? 'unknown'}` : 'guest';
  const shouldFetchCustomerProduct = hasMounted && !!customerToken;

  // Re-fetch with customer auth to get wholesale prices for wholesale users.
  const { product: clientProduct } = useProduct(
    shouldFetchCustomerProduct ? serverProduct.id : null,
    pricingKey,
  );
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
  const stock = selectedVariant?.stock ?? product.stock;
  const pricingCustomerType = customerType === 'wholesale' ? 'wholesale' : 'base';
  const resolvedUnitPriceQtyOne = selectedVariant?.price ?? product.basePrice;
  const variantRules = selectedVariant?.discountRules ?? [];
  const activeDiscountRuleId = selectedVariant?.activeDiscountRuleId ?? null;
  const baseUnitPrice = selectedVariant?.rawPrice ?? inferVariantRawUnitPrice(
    resolvedUnitPriceQtyOne,
    variantRules,
    activeDiscountRuleId,
  );
  const resolvedPricing = resolveVariantDiscount(variantRules, {
    quantity,
    unitPrice: baseUnitPrice,
    customerType: pricingCustomerType,
  });
  const currentPrice = resolvedPricing.effectiveUnitPrice;
  const originalPrice = resolvedPricing.lineDiscount > 0 ? formatRupiah(baseUnitPrice) : null;

  useEffect(() => {
    setQuantity((prev) => {
      if (stock <= 0) return 1;
      return Math.max(1, Math.min(prev, stock));
    });
  }, [stock, effectiveSelectedVariantId]);

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
            {originalPrice ?? formatRupiah(baseUnitPrice)}
          </p>
          <p className="text-xs text-muted-foreground">
            Total {quantity} item: {formatRupiah(resolvedPricing.effectiveLineTotal)}
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
          quantity={quantity}
          onQuantityChange={setQuantity}
        />
      </div>
    </>
  );
}
