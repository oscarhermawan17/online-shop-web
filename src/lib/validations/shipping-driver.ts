import { z } from 'zod';

export const shippingDriverSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama driver minimal 2 karakter')
    .max(100, 'Nama driver maksimal 100 karakter'),
  isActive: z.boolean(),
});

export type ShippingDriverFormData = z.infer<typeof shippingDriverSchema>;
