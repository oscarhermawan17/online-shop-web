'use client';

import Image from 'next/image';
import { cn, formatRupiah, getEffectivePrice } from '@/lib/utils';
import type { ProductVariant, VariantDiscountRule } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VariantSelectorProps {
  variants: ProductVariant[];
  basePrice: number;
  selectedVariantId: string | null;
  onSelect: (variantId: string | null) => void;
}

const getCustomerTypeLabel = (customerType: VariantDiscountRule['customerType']): string => {
  if (customerType === 'base') return 'Customer biasa';
  if (customerType === 'wholesale') return 'Customer retail';
  return 'Semua customer';
};

const getThresholdLabel = (rule: VariantDiscountRule): string => {
  const toLabel = (value: number) => (
    rule.triggerType === 'quantity'
      ? `${value} item`
      : formatRupiah(value)
  );

  const minLabel = toLabel(rule.minThreshold);
  if (rule.maxThreshold === null) {
    return `>= ${minLabel}`;
  }

  return `${minLabel} - ${toLabel(rule.maxThreshold)}`;
};

const getDiscountValueLabel = (rule: VariantDiscountRule): string => (
  rule.valueType === 'percentage'
    ? `${rule.value}%`
    : formatRupiah(rule.value)
);

const getApplyModeLabel = (applyMode: VariantDiscountRule['applyMode']): string => (
  applyMode === 'per_item' ? 'per item' : 'per total item'
);

const getSortedActiveRules = (variant: ProductVariant): VariantDiscountRule[] => (
  [...(variant.discountRules ?? [])]
    .filter((rule) => rule.isActive)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (b.minThreshold !== a.minThreshold) return b.minThreshold - a.minThreshold;
      return a.id.localeCompare(b.id);
    })
);

export function VariantSelector({
  variants,
  basePrice,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  if (variants.length === 0) {
    return null;
  }

  const hasVariantPromo = variants.some((variant) => getSortedActiveRules(variant).length > 0);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const selectedVariantActiveRules = selectedVariant ? getSortedActiveRules(selectedVariant) : [];

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Pilih Varian:</label>
        {hasVariantPromo ? (
          <p className="text-xs text-muted-foreground">
            Varian dengan badge <span className="font-semibold text-destructive">PROMO</span> punya rule diskon.
            Tap/pilih variannya untuk lihat syarat diskon.
          </p>
        ) : null}
      </div>
      <TooltipProvider delayDuration={120}>
        <div className="mt-3 flex flex-wrap gap-2">
          {variants.map((variant) => {
            const price = getEffectivePrice(basePrice, variant.priceOverride);
            const isSelected = selectedVariantId === variant.id;
            const isOutOfStock = variant.stock === 0;
            const activeRules = getSortedActiveRules(variant);
            const hasDiscountRules = activeRules.length > 0;

            const tile = (
              <div className="flex w-28 flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(isSelected ? null : variant.id)}
                  disabled={isOutOfStock}
                  className={cn(
                    'relative h-28 w-full overflow-hidden rounded-xl border-2 bg-muted/30 text-sm transition-all',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50',
                    isOutOfStock && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {hasDiscountRules ? (
                    <Badge
                      variant="destructive"
                      className="absolute right-1 top-1 z-20 px-1 py-0 text-[9px] font-semibold tracking-wide"
                    >
                      PROMO
                    </Badge>
                  ) : null}
                  {variant.imageUrl ? (
                    <Image
                      src={variant.imageUrl}
                      alt={variant.name || 'Variant'}
                      fill
                      className="object-contain"
                      sizes="112px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                      No Image
                    </div>
                  )}
                </button>

                <span
                  className={cn(
                    'line-clamp-1 text-center text-sm font-medium',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {variant.name || 'Varian'}
                </span>

                {variant.priceOverride && variant.priceOverride !== basePrice && (
                  <span className="text-xs text-muted-foreground">
                    {formatRupiah(price)}
                  </span>
                )}

                {isOutOfStock && (
                  <span className="text-xs text-destructive">Habis</span>
                )}
              </div>
            );

            if (!hasDiscountRules) {
              return <div key={variant.id}>{tile}</div>;
            }

            return (
              <Tooltip key={variant.id}>
                <TooltipTrigger asChild>
                  <div className="inline-flex">{tile}</div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs space-y-2 p-3 text-xs">
                  <p className="font-semibold">
                    {variant.name || 'Varian'} • {activeRules.length} rule aktif
                  </p>
                  {activeRules.slice(0, 3).map((rule, index) => (
                    <div key={rule.id} className="space-y-0.5">
                      <p className="font-medium">
                        {rule.name?.trim() || `Rule ${index + 1}`}
                      </p>
                      <p>
                        Trigger:{' '}
                        {rule.triggerType === 'quantity' ? 'Qty item' : 'Subtotal item'} {getThresholdLabel(rule)}
                      </p>
                      <p>
                        Diskon: {getDiscountValueLabel(rule)} ({getApplyModeLabel(rule.applyMode)})
                      </p>
                      {/* <p>Target: {getCustomerTypeLabel(rule.customerType)}</p> */}
                    </div>
                  ))}
                  {activeRules.length > 3 ? (
                    <p className="text-[11px] opacity-80">
                      +{activeRules.length - 3} rule lainnya
                    </p>
                  ) : null}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      {selectedVariant && selectedVariantActiveRules.length > 0 ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
          <p className="font-semibold text-destructive">
            Promo {selectedVariant.name || 'Varian'} ({selectedVariantActiveRules.length} rule)
          </p>
          <div className="mt-2 space-y-2">
            {selectedVariantActiveRules.map((rule, index) => (
              <div key={rule.id} className="space-y-0.5">
                <p className="font-medium text-foreground">
                  {rule.name?.trim() || `Rule ${index + 1}`}
                </p>
                <p className="text-muted-foreground">
                  Trigger: {rule.triggerType === 'quantity' ? 'Qty item' : 'Subtotal item'} {getThresholdLabel(rule)}
                </p>
                <p className="text-muted-foreground">
                  Diskon: {getDiscountValueLabel(rule)} ({getApplyModeLabel(rule.applyMode)})
                </p>
                {/* <p className="text-muted-foreground">
                  Target: {getCustomerTypeLabel(rule.customerType)}
                </p> */}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
