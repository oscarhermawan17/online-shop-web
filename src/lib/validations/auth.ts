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

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Password saat ini harus diisi'),
    newPassword: z
      .string()
      .min(6, 'Password baru minimal 6 karakter'),
    confirmNewPassword: z
      .string()
      .min(1, 'Konfirmasi password baru harus diisi'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Konfirmasi password baru tidak cocok',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Password baru harus berbeda dari password saat ini',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
