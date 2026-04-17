import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email atau nomor HP harus diisi'),
  password: z
    .string()
    .min(1, 'Password harus diisi'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  phone: z
    .string()
    .min(9, 'Nomor HP tidak valid')
    .max(15, 'Nomor HP tidak valid'),
  email: z
    .string()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
