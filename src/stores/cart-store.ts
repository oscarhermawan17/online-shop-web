import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VariantDiscountRule } from '@/types';

export interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  variantName?: string | null;
  baseUnitPrice?: number;
  discountRules?: VariantDiscountRule[];
  activeDiscountRuleId?: string | null;
  price: number;
  quantity: number;
  image?: string | null;
  stock: number;
}

interface CartStore {
  items: CartItem[];
  storeId: string | null;
  
  // Actions
  setStoreId: (storeId: string) => void;
  setItems: (items: CartItem[]) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  clearCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemQuantity: (productId: string, variantId?: string | null) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,

      setStoreId: (storeId) => set({ storeId }),
      setItems: (items) => set({ items }),

      addItem: (item) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          // Update quantity if item exists
          const newItems = [...items];
          const newQuantity = newItems[existingIndex].quantity + (item.quantity || 1);
          // Don't exceed stock
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            ...item,
            quantity: Math.min(newQuantity, item.stock),
          };
          set({ items: newItems });
        } else {
          // Add new item
          set({
            items: [...items, { ...item, quantity: item.quantity || 1 }],
          });
        }
      },

      updateQuantity: (productId, variantId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          set({
            items: items.filter(
              (i) => !(i.productId === productId && i.variantId === variantId)
            ),
          });
        } else {
          // Update quantity
          set({
            items: items.map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity: Math.min(quantity, i.stock) }
                : i
            ),
          });
        }
      },

      removeItem: (productId, variantId) => {
        const { items } = get();
        set({
          items: items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const qty = Number(item.quantity) || 0;
          return total + qty;
        }, 0);
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = Number(item.price) || 0;
          const qty = Number(item.quantity) || 0;
          return total + (price * qty);
        }, 0);
      },

      getItemQuantity: (productId, variantId) => {
        const { items } = get();
        const item = items.find(
          (i) => i.productId === productId && i.variantId === variantId
        );
        return item?.quantity || 0;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
