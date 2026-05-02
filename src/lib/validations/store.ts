import { z } from 'zod';

const VALID_BANK_NAMES = ['BCA', 'BRI', 'BNI', 'Mandiri', 'BankPapua', 'BTN'] as const;

export const bankAccountSchema = z.object({
  bankName: z.enum(VALID_BANK_NAMES, { error: 'Pilih nama bank' }),
  accountNumber: z
    .string()
    .min(1, 'Nomor rekening tidak boleh kosong')
    .max(30, 'Nomor rekening maksimal 30 karakter'),
  accountHolder: z
    .string()
    .min(1, 'Nama pemilik rekening tidak boleh kosong')
    .max(100, 'Nama pemilik rekening maksimal 100 karakter'),
});

export const storeSchema = z.object({
  name: z
    .string()
    .min(3, 'Nama toko minimal 3 karakter')
    .max(100, 'Nama toko maksimal 100 karakter'),
  description: z
    .string()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional(),
  address: z
    .string()
    .max(500, 'Alamat maksimal 500 karakter')
    .optional(),
  bankAccounts: z.array(bankAccountSchema),
  qrisImageUrl: z
    .string()
    .url('URL QRIS tidak valid')
    .optional()
    .or(z.literal('')),
  deliveryRetailMinimumOrder: z
    .number()
    .min(0, 'Minimal belanja retail tidak boleh negatif')
    .max(999999999, 'Nilai terlalu besar')
    .nullable()
    .optional(),
  deliveryStoreMinimumOrder: z
    .number()
    .min(0, 'Minimal belanja toko tidak boleh negatif')
    .max(999999999, 'Nilai terlalu besar')
    .nullable()
    .optional(),
  deliveryRetailFreeShippingMinimumOrder: z
    .number()
    .min(0, 'Minimal free ongkir retail tidak boleh negatif')
    .max(999999999, 'Nilai terlalu besar')
    .nullable()
    .optional(),
  deliveryStoreFreeShippingMinimumOrder: z
    .number()
    .min(0, 'Minimal free ongkir toko tidak boleh negatif')
    .max(999999999, 'Nilai terlalu besar')
    .nullable()
    .optional(),
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;
export type StoreFormData = z.infer<typeof storeSchema>;
