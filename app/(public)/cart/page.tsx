'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem, CartSummary } from '@/components/public';
import { EmptyState } from '@/components/shared';
import { useCartStore } from '@/stores';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          type="cart"
          title="Keranjang Kosong"
          description="Anda belum menambahkan produk ke keranjang."
          actionLabel="Lihat Produk"
          actionHref="/"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Keranjang Belanja</h1>
          <p className="text-muted-foreground">{items.length} produk</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <CartItem
              key={`${item.productId}-${item.variantId}`}
              item={item}
            />
          ))}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24">
          <CartSummary showCheckoutButton />
        </div>
      </div>
    </div>
  );
}
