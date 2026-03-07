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
});

export type StoreFormData = z.infer<typeof storeSchema>;
