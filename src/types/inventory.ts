export type StockMovementStatus = 'in' | 'out';

export type StockMovementCategory =
  | 'initial_stock'
  | 'add_stock'
  | 'sale'
  | 'restore';

export interface InventoryMovementItem {
  id: string;
  createdAt: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string | null;
  stockStatus: StockMovementStatus;
  stockStatusLabel: string;
  category: StockMovementCategory;
  categoryLabel: string;
  quantity: number;
  inQty: number;
  outQty: number;
  stock: number;
  notes: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdByAdmin: string | null;
}

