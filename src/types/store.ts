export type BankName = 'BCA' | 'BRI' | 'BNI' | 'Mandiri' | 'BankPapua' | 'BTN';

export const BANK_NAME_LABELS: Record<BankName, string> = {
  BCA: 'BCA',
  BRI: 'BRI',
  BNI: 'BNI',
  Mandiri: 'Mandiri',
  BankPapua: 'Bank Papua',
  BTN: 'BTN',
};

export const BANK_NAME_OPTIONS: { value: BankName; label: string }[] = [
  { value: 'BCA', label: 'BCA' },
  { value: 'BRI', label: 'BRI' },
  { value: 'BNI', label: 'BNI' },
  { value: 'Mandiri', label: 'Mandiri' },
  { value: 'BankPapua', label: 'Bank Papua' },
  { value: 'BTN', label: 'BTN' },
];

export interface StoreBankAccount {
  id?: string;
  bankName: BankName;
  accountNumber: string;
  accountHolder: string;
  sortOrder?: number;
}

export interface Store {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  bankAccounts: StoreBankAccount[];
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
  qrisImageUrl?: string;
  deliveryRetailMinimumOrder?: number | null;
  deliveryStoreMinimumOrder?: number | null;
  deliveryRetailFreeShippingMinimumOrder?: number | null;
  deliveryStoreFreeShippingMinimumOrder?: number | null;
}
