import { z } from 'zod';

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  customerPhone: z
    .string()
    .min(10, 'Nomor HP minimal 10 digit')
    .max(15, 'Nomor HP maksimal 15 digit')
    .regex(/^[0-9+]+$/, 'Nomor HP hanya boleh angka'),
  customerAddress: z
    .string()
    .min(10, 'Alamat minimal 10 karakter')
    .max(500, 'Alamat maksimal 500 karakter'),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
