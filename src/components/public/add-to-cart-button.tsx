'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores';
import { toast } from 'sonner';
import { getEffectivePrice } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types';

interface AddToCartButtonProps {
  product: Product;
  selectedVariant: ProductVariant | null;
}

export function AddToCartButton({ product, selectedVariant }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const setStoreId = useCartStore((state) => state.setStoreId);

  const hasVariants = product.variants.length > 0;
  const needsVariantSelection = hasVariants && !selectedVariant;

  const stock = selectedVariant?.stock ?? product.stock;
  const price = getEffectivePrice(product.basePrice, selectedVariant?.priceOverride);
  const isOutOfStock = stock === 0;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (needsVariantSelection) {
      toast.error('Silakan pilih varian terlebih dahulu');
      return;
    }

    if (isOutOfStock) {
      toast.error('Stok produk habis');
      return;
    }

    // Set store ID for checkout
    setStoreId(product.storeId);

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id || null,
      name: product.name,
      variantName: selectedVariant?.name || null,
      price,
      quantity,
      image: product.images?.[0]?.imageUrl || null,
      stock,
    });

    toast.success('Produk ditambahkan ke keranjang', {
      description: `${quantity}x ${product.name}${selectedVariant ? ` - ${selectedVariant.name}` : ''}`,
    });

    setQuantity(1);
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Jumlah:</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1 || isOutOfStock || needsVariantSelection}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= stock || isOutOfStock || needsVariantSelection}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {!needsVariantSelection && (
          <span className="text-sm text-muted-foreground">
            Stok: {stock}
          </span>
        )}
      </div>

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        disabled={isOutOfStock || needsVariantSelection}
        className="w-full gap-2"
        size="lg"
      >
        <ShoppingCart className="h-5 w-5" />
        {isOutOfStock
          ? 'Stok Habis'
          : needsVariantSelection
          ? 'Pilih Varian'
          : 'Tambah ke Keranjang'}
      </Button>
    </div>
  );
}
