import { z } from 'zod';

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
  bankName: z
    .string()
    .max(50, 'Nama bank maksimal 50 karakter')
    .optional(),
  bankAccountNumber: z
    .string()
    .max(30, 'Nomor rekening maksimal 30 karakter')
    .optional(),
  bankAccountName: z
    .string()
    .max(100, 'Nama pemilik rekening maksimal 100 karakter')
    .optional(),
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

export type StoreFormData = z.infer<typeof storeSchema>;
