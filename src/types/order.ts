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
  productName: string;
  variantDescription?: string | null;
  imageUrl?: string | null;
  originalPrice?: number | null;
  price: number;
  quantity: number;
}

export interface ShippingShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  sortOrder?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShippingShiftPayload {
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ShippingDriver {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShippingDriverPayload {
  name: string;
  isActive: boolean;
}

export interface OrderShippingAssignment {
  deliveryDate: string;
  shiftId: string;
  driverName: string;
  assignedAt?: string;
  assignedByAdminId?: string | null;
  shiftName?: string | null;
  shiftStartTime?: string | null;
  shiftEndTime?: string | null;
  shiftLabel?: string | null;
}

export interface Order {
  id: string;
  publicOrderId: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryMethod: DeliveryMethod | null;
  paymentMethod: PaymentMethod | null;
  notes?: string | null;
  shippingCost: number;
  totalAmount: number;
  status: OrderStatus;
  creditSettledAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  paymentProof?: PaymentProof | null;
  shippingAssignment?: OrderShippingAssignment | null;
}

export interface PaymentProof {
  id: string;
  imageUrl: string;
  uploadedAt: string;
}

export interface PublicOrder {
  publicOrderId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  deliveryMethod: DeliveryMethod | null;
  notes: string | null;
  shippingCost: number;
  totalAmount: number;
  creditSettledAt: string | null;
  expiresAt: string | null;
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
  shippingAssignment?: OrderShippingAssignment | null;
}

export interface CheckoutItemPayload {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export type DeliveryMethod = 'pickup' | 'delivery';

export interface CheckoutPayload {
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  notes?: string;
  shippingCost?: number;
  items: CheckoutItemPayload[];
}

export interface CheckoutResponse {
  publicOrderId: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  shippingCost: number;
  expiresAt: string | null;
  minimumOrderApplied?: number | null;
  freeShippingMinimumOrderApplied?: number | null;
  isFreeShippingApplied?: boolean;
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

export interface ShipOrderPayload {
  deliveryDate: string;
  shiftId: string;
  driverName: string;
}

export type PaymentMethod = 'bank_transfer' | 'credit';
