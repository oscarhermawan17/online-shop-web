'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string().min(9, 'Nomor HP tidak valid').max(15, 'Nomor HP tidak valid'),
  email: z
    .string()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type FormData = z.infer<typeof schema>;

export default function AddCustomerPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/admin/customers', {
        name: data.name,
        phone: `62${data.phone}`,
        email: data.email || undefined,
        password: data.password,
      });
      toast.success('Pelanggan berhasil ditambahkan');
      router.push('/admin/customers');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || 'Gagal menambahkan pelanggan';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/customers" className="hover:text-primary transition-colors">
              Pelanggan
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Tambah Pelanggan Baru</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Pelanggan Baru</h1>
          <p className="text-muted-foreground mt-0.5">
            Lengkapi data pelanggan untuk mendaftarkan akun baru.
          </p>
        </div>
        <Link
          href="/admin/customers"
          className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow-[0px_4px_24px_rgba(0,0,0,0.04)] p-6 md:p-8 space-y-8">

            {/* Section: Identitas */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-7 w-1 bg-primary rounded-full" />
                <h2 className="font-bold text-foreground tracking-tight">Informasi Pelanggan</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-[#f1f5f9] border-b-2 border-[#acb4b1] outline-none px-4 py-3 rounded-t-lg focus:border-primary transition-colors text-sm"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Nomor HP */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Nomor HP / WhatsApp <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                      +62
                    </span>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="812-3456-7890"
                      className="w-full bg-[#f1f5f9] border-b-2 border-[#acb4b1] outline-none pl-14 pr-4 py-3 rounded-t-lg focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <span className="text-[10px] bg-[#e4e9e7] px-2 py-0.5 rounded text-muted-foreground font-bold uppercase tracking-tighter">
                    Opsional
                  </span>
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="budi@email.com"
                  className="w-full bg-[#f1f5f9] border-b-2 border-[#acb4b1] outline-none px-4 py-3 rounded-t-lg focus:border-primary transition-colors text-sm"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Section: Akun */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-7 w-1 bg-primary rounded-full" />
                <h2 className="font-bold text-foreground tracking-tight">Akun Login</h2>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-[#f1f5f9] border-b-2 border-[#acb4b1] outline-none px-4 py-3 pr-12 rounded-t-lg focus:border-primary transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Pelanggan akan menggunakan nomor HP dan password ini untuk login.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#f1f5f9]">
              <Link
                href="/admin/customers"
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-[#f1f5f9] transition-all"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 rounded-lg bg-gradient-to-br from-primary to-[#006118] text-[#eaffe2] font-bold shadow-lg shadow-green-900/20 hover:shadow-green-900/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
