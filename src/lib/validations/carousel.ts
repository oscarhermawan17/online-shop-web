import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
};

const optionalTrimmedString = (max: number, message: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(max, message).optional()
  );

export const carouselSlideInputSchema = z.object({
  id: z.string().trim().min(1, 'ID slide tidak valid').optional(),
  title: optionalTrimmedString(120, 'Judul slide maksimal 120 karakter'),
  subtitle: optionalTrimmedString(240, 'Subjudul slide maksimal 240 karakter'),
  badge: optionalTrimmedString(50, 'Badge slide maksimal 50 karakter'),
  imageUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url('URL gambar slide tidak valid').optional()
  ),
  backgroundColor: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .trim()
      .regex(
        /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
        'Warna slide harus berupa hex, contoh #166534'
      )
      .optional()
  ),
  showText: z.boolean().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).optional(),
});

export const carouselSlidesPayloadSchema = z
  .object({
    slides: z
      .array(carouselSlideInputSchema)
      .min(1, 'Minimal harus ada 1 slide')
      .max(10, 'Maksimal 10 slide'),
  })
  .superRefine((value, ctx) => {
    if (!value.slides.some((slide) => slide.isActive)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal harus ada 1 slide aktif',
        path: ['slides'],
      });
    }
  });

export const carouselSlideSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(120),
  subtitle: z.string().max(240).nullable().optional(),
  badge: z.string().max(50).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  backgroundColor: z
    .string()
    .regex(/^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .nullable()
    .optional(),
  showText: z.boolean().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const carouselSlidesSchema = z.array(carouselSlideSchema);
