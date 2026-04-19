'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem, CartSummary } from '@/components/public';
import { EmptyState } from '@/components/shared';
import { useCartStore, useCustomerAuthStore } from '@/stores';
import { syncCartItemsWithServer } from '@/lib/cart';
import { toast } from 'sonner';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const customerToken = useCustomerAuthStore((state) => state.token);
  const customerType = useCustomerAuthStore((state) => state.customer?.type);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || items.length === 0) {
      return;
    }

    let isCancelled = false;

    const syncCart = async () => {
      const result = await syncCartItemsWithServer(items);
      if (isCancelled || !result.changed) {
        return;
      }

      setItems(result.items);
      toast.info('Keranjang diperbarui dengan harga dan stok terbaru.');
    };

    void syncCart();

    return () => {
      isCancelled = true;
    };
  }, [mounted, customerToken, customerType, setItems]);

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
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
        <Button asChild variant="outline" className="hidden sm:inline-flex">
          <Link href="/">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Link>
        </Button>
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
          <CartSummary
            showCheckoutButton
            customerType={customerType ?? 'base'}
          />
        </div>
      </div>
    </div>
  );
}
