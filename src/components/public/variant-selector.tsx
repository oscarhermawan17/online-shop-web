'use client';

import { cn, formatRupiah, getEffectivePrice } from '@/lib/utils';
import type { ProductVariant } from '@/types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  basePrice: number;
  selectedVariantId: string | null;
  onSelect: (variantId: string | null) => void;
}

export function VariantSelector({
  variants,
  basePrice,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Pilih Varian:</label>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const price = getEffectivePrice(basePrice, variant.priceOverride);
          const isSelected = selectedVariantId === variant.id;
          const isOutOfStock = variant.stock === 0;

          return (
            <button
              key={variant.id}
              onClick={() => onSelect(isSelected ? null : variant.id)}
              disabled={isOutOfStock}
              className={cn(
                'rounded-lg border-2 px-4 py-2 text-sm transition-all',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50',
                isOutOfStock && 'cursor-not-allowed opacity-50 line-through'
              )}
            >
              <span className="font-medium">{variant.name}</span>
              {variant.priceOverride && variant.priceOverride !== basePrice && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({formatRupiah(price)})
                </span>
              )}
              {isOutOfStock && (
                <span className="ml-1 text-xs text-destructive">(Habis)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
