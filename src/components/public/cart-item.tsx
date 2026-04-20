'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, type CartItem as CartItemType } from '@/stores';
import { formatRupiah, getPlaceholderImage, getThumbnailUrl } from '@/lib/utils';
import { useCustomerAuthStore } from '@/stores/customer-auth-store';
import { resolveCartItemPricing } from '@/lib/variant-discount';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const customerType = useCustomerAuthStore((state) => state.customer?.type ?? 'base');

  // Ensure values are valid numbers
  const quantity = Number(item.quantity) || 1;
  const stock = Number(item.stock) || 1;
  const pricing = resolveCartItemPricing(item, customerType);
  const unitPrice = pricing.unitPrice;
  const lineTotal = pricing.lineTotal;
  const lineSubtotal = pricing.lineSubtotal;
  const lineDiscount = pricing.lineDiscount;
  const originalUnitPrice = quantity > 0 ? Math.round(lineSubtotal / quantity) : unitPrice;
  const appliedRule = pricing.appliedRule;
  const ruleTriggerText = appliedRule
    ? appliedRule.triggerType === 'quantity'
      ? `Min ${appliedRule.minThreshold} qty`
      : `Min subtotal ${formatRupiah(appliedRule.minThreshold)}`
    : null;

  const imageUrl = item.image
    ? getThumbnailUrl(item.image, 100)
    : getPlaceholderImage(100, 100);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    updateQuantity(item.productId, item.variantId, newQuantity);
  };

  const handleRemove = () => {
    removeItem(item.productId, item.variantId);
  };

  return (
    <div className="flex gap-4 rounded-lg border p-4">
      {/* Image */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-medium">{item.name}</h3>
          {item.variantName && (
            <p className="text-sm text-muted-foreground">
              Varian: {item.variantName}
            </p>
          )}
          {lineDiscount > 0 ? (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground line-through">
                {formatRupiah(originalUnitPrice)}
              </p>
              <p className="text-sm font-semibold text-primary">{formatRupiah(unitPrice)}</p>
              <p className="text-xs text-green-600">
                Hemat {formatRupiah(lineDiscount)}
                {appliedRule?.name ? ` • ${appliedRule.name}` : ''}
              </p>
              {ruleTriggerText ? (
                <p className="text-[11px] text-muted-foreground">{ruleTriggerText}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm font-semibold text-primary">{formatRupiah(unitPrice)}</p>
          )}
        </div>

        {/* Quantity & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= stock}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Subtotal (Desktop) */}
      <div className="hidden flex-shrink-0 text-right sm:block">
        <p className="text-sm text-muted-foreground">Subtotal</p>
        {lineDiscount > 0 ? (
          <div>
            <p className="text-xs text-muted-foreground line-through">
              {formatRupiah(lineSubtotal)}
            </p>
            <p className="font-semibold">{formatRupiah(lineTotal)}</p>
          </div>
        ) : (
          <p className="font-semibold">{formatRupiah(lineTotal)}</p>
        )}
      </div>
    </div>
  );
}
