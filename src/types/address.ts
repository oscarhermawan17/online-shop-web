export interface CustomerAddress {
  id: string;
  storeId: string;
  customerId: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  district: string | null;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressPayload {
  label: string;
  recipient: string;
  phone: string;
  address: string;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
  isDefault?: boolean;
}

export interface UpdateAddressPayload extends Partial<CreateAddressPayload> {}
