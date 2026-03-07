import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Nama produk minimal 3 karakter')
    .max(200, 'Nama produk maksimal 200 karakter'),
  description: z
    .string()
    .max(2000, 'Deskripsi maksimal 2000 karakter')
    .optional(),
  basePrice: z
    .number()
    .min(0, 'Harga tidak boleh negatif')
    .max(999999999, 'Harga terlalu besar'),
  stock: z
    .number()
    .int('Stok harus bilangan bulat')
    .min(0, 'Stok tidak boleh negatif'),
});

export type ProductFormData = z.infer<typeof productSchema>;

export const variantSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama variant harus diisi')
    .max(100, 'Nama variant maksimal 100 karakter'),
  priceOverride: z
    .number()
    .min(0, 'Harga tidak boleh negatif')
    .nullable()
    .optional(),
  stock: z
    .number()
    .int('Stok harus bilangan bulat')
    .min(0, 'Stok tidak boleh negatif'),
});

export type VariantFormData = z.infer<typeof variantSchema>;
