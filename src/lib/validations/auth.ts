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
