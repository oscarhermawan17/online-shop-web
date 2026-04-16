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
  name: z.string().max(100, 'Nama varian maksimal 100 karakter').optional(),
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
  })
  .superRefine((data, ctx) => {
    if (data.variants.length <= 1) {
      return;
    }

    data.variants.forEach((variant, index) => {
      if (!variant.name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nama varian wajib diisi jika lebih dari satu',
          path: ['variants', index, 'name'],
        });
      }
    });
  });

export type CreateProductFormData = z.infer<typeof createProductSchema>;

export const variantSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama variant harus diisi')
    .max(100, 'Nama variant maksimal 100 karakter'),
  priceOverride: nullablePriceSchema,
  wholesalePriceOverride: nullablePriceSchema,
  stock: stockSchema,
});

export type VariantFormData = z.infer<typeof variantSchema>;
