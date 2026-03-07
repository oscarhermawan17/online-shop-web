export interface Store {
  id: string;
  name: string;
  description?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  qrisImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStorePayload {
  name?: string;
  description?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  qrisImageUrl?: string;
}
