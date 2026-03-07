export type OrderStatus =
  | 'pending_payment'
  | 'waiting_confirmation'
  | 'paid'
  | 'shipped'
  | 'done'
  | 'expired_unpaid'
  | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  publicOrderId: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string | null;
  totalAmount: number;
  status: OrderStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  paymentProof?: PaymentProof | null;
}

export interface PaymentProof {
  id: string;
  imageUrl: string;
  uploadedAt: string;
}

export interface PublicOrder {
  publicOrderId: string;
  status: OrderStatus;
  customerName: string;
  totalAmount: number;
  expiresAt: string;
  createdAt: string;
  items: OrderItem[];
  store: {
    name: string;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    qrisImageUrl?: string | null;
  };
  paymentProof?: PaymentProof | null;
}

export interface CheckoutItemPayload {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CheckoutPayload {
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  items: CheckoutItemPayload[];
}

export interface CheckoutResponse {
  publicOrderId: string;
  totalAmount: number;
  expiresAt: string;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  qrisImageUrl?: string | null;
}

export interface PaymentProofPayload {
  publicOrderId: string;
  imageUrl: string;
}

export interface UpdateOrderStatusPayload {
  status: 'shipped' | 'done' | 'cancelled';
}
