import api from '@/lib/api';
import type { Product } from '@/types';
import type { CartItem } from '@/stores/cart-store';

export interface SyncedCartResult {
  items: CartItem[];
  changed: boolean;
  removedCount: number;
}

const areCartItemsEqual = (left: CartItem, right: CartItem) => (
  left.productId === right.productId
  && left.variantId === right.variantId
  && left.name === right.name
  && left.variantName === right.variantName
  && left.price === right.price
  && left.quantity === right.quantity
  && left.image === right.image
  && left.stock === right.stock
);

export async function syncCartItemsWithServer(items: CartItem[]): Promise<SyncedCartResult> {
  if (items.length === 0) {
    return {
      items: [],
      changed: false,
      removedCount: 0,
    };
  }

  const uniqueProductIds = [...new Set(items.map((item) => item.productId))];
  const productEntries = await Promise.all(uniqueProductIds.map(async (productId) => {
    try {
      const response = await api.get<{ data: Product }>(`/products/${productId}`);
      return [productId, response.data.data] as const;
    } catch {
      return [productId, null] as const;
    }
  }));

  const productMap = new Map(productEntries);
  let changed = false;
  let removedCount = 0;

  const nextItems = items.flatMap((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      changed = true;
      removedCount += 1;
      return [];
    }

    const variant = item.variantId
      ? product.variants.find((candidate) => candidate.id === item.variantId)
      : null;

    if (item.variantId && !variant) {
      changed = true;
      removedCount += 1;
      return [];
    }

    const stock = variant?.stock ?? product.stock;
    const quantity = Math.min(item.quantity, stock);

    if (stock <= 0 || quantity <= 0) {
      changed = true;
      removedCount += 1;
      return [];
    }

    const nextItem: CartItem = {
      productId: item.productId,
      variantId: item.variantId ?? null,
      name: product.name,
      variantName: variant?.name ?? null,
      price: variant?.price ?? product.basePrice,
      quantity,
      image: variant?.imageUrl ?? product.images[0]?.imageUrl ?? item.image ?? null,
      stock,
    };

    if (!areCartItemsEqual(item, nextItem)) {
      changed = true;
    }

    return [nextItem];
  });

  return {
    items: nextItems,
    changed,
    removedCount,
  };
}
