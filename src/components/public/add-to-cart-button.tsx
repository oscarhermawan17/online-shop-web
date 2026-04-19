'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Product, ProductVariant } from '@/types';
import { inferVariantRawUnitPrice } from '@/lib/variant-discount';

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
  const isOutOfStock = stock === 0;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
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

    let latestProduct = product;

    try {
      const response = await api.get<{ data: Product }>(`/products/${product.id}`);
      latestProduct = response.data.data;
    } catch {
      toast.error('Gagal memuat harga terbaru produk');
      return;
    }

    const latestVariant = selectedVariant
      ? latestProduct.variants.find((variant) => variant.id === selectedVariant.id) ?? null
      : null;

    if (selectedVariant && !latestVariant) {
      toast.error('Varian produk sudah tidak tersedia');
      return;
    }

    const latestStock = latestVariant?.stock ?? latestProduct.stock;
    const latestPrice = latestVariant?.price ?? latestProduct.basePrice;
    const latestDiscountRules = latestVariant?.discountRules ?? [];
    const activeDiscountRuleId = latestVariant?.activeDiscountRuleId ?? null;
    const baseUnitPrice = latestVariant?.rawPrice ?? inferVariantRawUnitPrice(
      latestPrice,
      latestDiscountRules,
      activeDiscountRuleId,
    );

    if (latestStock === 0) {
      toast.error('Stok produk habis');
      return;
    }

    const nextQuantity = Math.min(quantity, latestStock);

    addItem({
      productId: latestProduct.id,
      variantId: latestVariant?.id || null,
      name: latestProduct.name,
      variantName: latestVariant?.name || null,
      baseUnitPrice,
      discountRules: latestDiscountRules,
      activeDiscountRuleId,
      price: latestPrice,
      quantity: nextQuantity,
      image: latestVariant?.imageUrl ?? latestProduct.images?.[0]?.imageUrl ?? null,
      stock: latestStock,
    });

    toast.success('Produk ditambahkan ke keranjang', {
      description: `${nextQuantity}x ${latestProduct.name}${latestVariant ? ` - ${latestVariant.name}` : ''}`,
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
