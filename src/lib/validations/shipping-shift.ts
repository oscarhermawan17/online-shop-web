import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const shippingShiftSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nama shift minimal 2 karakter')
      .max(100, 'Nama shift maksimal 100 karakter'),
    startTime: z.string().regex(timePattern, 'Jam mulai tidak valid'),
    endTime: z.string().regex(timePattern, 'Jam selesai tidak valid'),
    isActive: z.boolean(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'Jam selesai harus lebih besar dari jam mulai',
    path: ['endTime'],
  });

export type ShippingShiftFormData = z.infer<typeof shippingShiftSchema>;

export const shipOrderSchema = z.object({
  deliveryDate: z
    .string()
    .regex(datePattern, 'Tanggal pengiriman wajib diisi')
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00`)), {
      message: 'Tanggal pengiriman tidak valid',
    }),
  shiftId: z.string().min(1, 'Shift pengiriman wajib dipilih'),
  driverName: z
    .string()
    .trim()
    .min(2, 'Nama driver minimal 2 karakter')
    .max(100, 'Nama driver maksimal 100 karakter'),
});

export type ShipOrderFormData = z.infer<typeof shipOrderSchema>;
