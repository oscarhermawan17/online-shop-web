export interface Store {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  qrisImageUrl?: string | null;
  deliveryRetailMinimumOrder?: number | null;
  deliveryStoreMinimumOrder?: number | null;
  deliveryRetailFreeShippingMinimumOrder?: number | null;
  deliveryStoreFreeShippingMinimumOrder?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStorePayload {
  name?: string;
  description?: string;
  address?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  qrisImageUrl?: string;
  deliveryRetailMinimumOrder?: number | null;
  deliveryStoreMinimumOrder?: number | null;
  deliveryRetailFreeShippingMinimumOrder?: number | null;
  deliveryStoreFreeShippingMinimumOrder?: number | null;
}
