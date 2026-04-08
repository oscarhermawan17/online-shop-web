'use client';

import Link from 'next/link';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores';
import { formatRupiah } from '@/lib/utils';
import type { DeliveryMethod } from '@/types';

interface CartSummaryProps {
  showCheckoutButton?: boolean;
  deliveryMethod?: DeliveryMethod;
  shippingCost?: number | null;
  shippingDistrict?: string | null;
  shippingUnavailable?: boolean;
}

export function CartSummary({
  showCheckoutButton = true,
  deliveryMethod,
  shippingCost,
  shippingDistrict,
  shippingUnavailable,
}: CartSummaryProps) {
  const items = useCartStore((state) => state.items);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const isDelivery = deliveryMethod === 'delivery';
  const resolvedShipping = isDelivery ? (shippingCost ?? null) : null;
  const grandTotal = totalPrice + (resolvedShipping ?? 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            return (
              <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.name}
                  {item.variantName && ` (${item.variantName})`} x {qty}
                </span>
                <span>{formatRupiah(price * qty)}</span>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="flex justify-between text-sm">
          <span>Total Item</span>
          <span>{totalItems} item</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Subtotal Produk</span>
          <span>{formatRupiah(totalPrice)}</span>
        </div>

        {/* Shipping cost row */}
        {isDelivery && (
          <div className="flex justify-between text-sm">
            <span className="flex flex-col">
              <span>Ongkos Kirim</span>
              {shippingDistrict && (
                <span className="text-xs text-muted-foreground">
                  Kec. {shippingDistrict}
                </span>
              )}
            </span>
            <span>
              {resolvedShipping !== null ? (
                formatRupiah(resolvedShipping)
              ) : shippingUnavailable ? (
                <span className="text-xs font-medium text-destructive">Tidak tersedia</span>
              ) : (
                <span className="text-xs text-muted-foreground">Masukkan alamat</span>
              )}
            </span>
          </div>
        )}

        {deliveryMethod === 'pickup' && (
          <div className="flex justify-between text-sm">
            <span>Ongkos Kirim</span>
            <span className="font-medium text-green-600">Gratis</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-primary">{formatRupiah(grandTotal)}</span>
        </div>
      </CardContent>

      {showCheckoutButton && (
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full gap-2" size="lg">
            <Link href="/checkout">
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={clearCart}
          >
            <Trash2 className="h-4 w-4" />
            Kosongkan Keranjang
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
