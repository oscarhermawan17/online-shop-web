import { z } from 'zod';

const priceSchema = z
  .number()
  .min(0, 'Harga tidak boleh negatif')
  .max(999999999, 'Harga terlalu besar');

const nullablePriceSchema = priceSchema.nullable().optional();

const stockSchema = z
  .number()
  .int('Stok harus bilangan bulat')
  .min(0, 'Stok tidak boleh negatif');

export const productSchema = z.object({
  categoryIds: z.array(z.string()).optional(),
  unitId: z.string().nullable().optional(),
  name: z
    .string()
    .min(3, 'Nama produk minimal 3 karakter')
    .max(200, 'Nama produk maksimal 200 karakter'),
  description: z
    .string()
    .max(2000, 'Deskripsi maksimal 2000 karakter')
    .optional(),
  basePrice: priceSchema,
  wholesalePrice: nullablePriceSchema,
  stock: stockSchema,
});

export type ProductFormData = z.infer<typeof productSchema>;

export const createProductVariantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama varian harus diisi')
    .max(100, 'Nama varian maksimal 100 karakter'),
  imageUrl: z.string().url('URL gambar varian tidak valid').nullable().optional(),
  basePrice: priceSchema,
  wholesalePrice: nullablePriceSchema,
  stock: stockSchema,
});

export const createProductSchema = z
  .object({
    categoryIds: z.array(z.string()).optional(),
    unitId: z.string().nullable().optional(),
    name: z
      .string()
      .min(3, 'Nama produk minimal 3 karakter')
      .max(200, 'Nama produk maksimal 200 karakter'),
    description: z
      .string()
      .max(2000, 'Deskripsi maksimal 2000 karakter')
      .optional(),
    variants: z.array(createProductVariantSchema).min(1, 'Minimal 1 varian'),
  });

export type CreateProductFormData = z.infer<typeof createProductSchema>;

export const variantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama variant harus diisi')
    .max(100, 'Nama variant maksimal 100 karakter'),
  imageUrl: z
    .string()
    .url('URL gambar varian tidak valid')
    .nullable()
    .optional(),
  priceOverride: nullablePriceSchema,
  wholesalePriceOverride: nullablePriceSchema,
  stock: stockSchema,
});

export type VariantFormData = z.infer<typeof variantSchema>;
