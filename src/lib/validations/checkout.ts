import { z } from 'zod';

export const checkoutSchema = z
  .object({
    customerName: z
      .string()
      .min(3, 'Nama minimal 3 karakter')
      .max(100, 'Nama maksimal 100 karakter'),
    customerPhone: z
      .string()
      .min(10, 'Nomor HP minimal 10 digit')
      .max(15, 'Nomor HP maksimal 15 digit')
      .regex(/^[0-9+]+$/, 'Nomor HP hanya boleh angka'),
    deliveryMethod: z.enum(['pickup', 'delivery']),
    customerAddress: z.string().optional(),
    notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
  })
  .refine(
    (data) => {
      if (data.deliveryMethod === 'delivery') {
        return !!data.customerAddress && data.customerAddress.length >= 10;
      }
      return true;
    },
    {
      message: 'Alamat minimal 10 karakter',
      path: ['customerAddress'],
    }
  )
  .refine(
    (data) => {
      if (data.deliveryMethod === 'delivery') {
        return !data.customerAddress || data.customerAddress.length <= 500;
      }
      return true;
    },
    {
      message: 'Alamat maksimal 500 karakter',
      path: ['customerAddress'],
    }
  );

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
