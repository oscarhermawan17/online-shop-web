'use client';

import { useState } from 'react';
import { User, Camera } from 'lucide-react';
import { useCustomerAuthStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function ProfilePage() {
  const customer = useCustomerAuthStore((state) => state.customer);
  const [loading, setLoading] = useState(false);

  // Generate days, months, years for selects
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Profil berhasil diperbarui');
    }, 1000);
  };

  const maskEmail = (email: string | null) => {
    if (!email) return 'Belum ada email';
    const [user, domain] = email.split('@');
    return `${user.slice(0, 2)}${'*'.repeat(user.length - 2)}@${domain}`;
  };

  return (
    <div className="space-y-4">
      <div className="pb-1">
        <h1 className="text-lg font-medium text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-600 mt-1">
          Kelola informasi profil Anda untuk mengontrol, melindungi dan mengamankan akun
        </p>
      </div>

      <Separator className="bg-gray-100" />

      <div className="flex flex-col-reverse md:flex-row gap-8 pt-2">
        {/* Left Side: Form */}
        <form onSubmit={handleSave} className="flex-1 space-y-6">
          <div className="grid grid-cols-[140px,1fr] items-center gap-y-4">
            {/* Username */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Username</Label>
            <div className="space-y-1">
              <span className="text-sm text-gray-900 font-medium">{customer?.phone || 'frederykabryan'}</span>
              <p className="text-[11px] text-gray-400">Username hanya dapat diubah satu (1) kali.</p>
            </div>

            {/* Nama */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Nama</Label>
            <Input
              placeholder="Masukkan nama"
              defaultValue={customer?.name || ''}
              className="max-w-md h-10 border-gray-200"
            />

            {/* Email */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Email</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-900">{maskEmail(customer?.email || 'fa*******@gmail.com')}</span>
              <button type="button" className="text-blue-600 text-sm hover:underline">Ubah</button>
            </div>

            {/* Nomor Telepon */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Nomor Telepon</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-900">{customer?.phone || '********3456'}</span>
              <button type="button" className="text-blue-600 text-sm hover:underline">Ubah</button>
            </div>

            {/* Nama Toko */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Nama Toko</Label>
            <Input
              placeholder="Masukkan nama toko"
              defaultValue="frederykabryan"
              className="max-w-md h-10 border-gray-200"
            />

            {/* Jenis Kelamin */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Jenis Kelamin</Label>
            <div className="flex items-center gap-6">
              {['Laki-laki', 'Perempuan', 'Lainnya'].map((label) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    value={label.toLowerCase()}
                    className="w-4 h-4 text-[#ee4d2d] focus:ring-[#ee4d2d] border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            {/* Tanggal Lahir */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Tanggal lahir</Label>
            <div className="flex gap-2 max-w-md">
              <Select defaultValue="9">
                <SelectTrigger className="h-10 border-gray-200 flex-1">
                  <SelectValue placeholder="Tanggal" />
                </SelectTrigger>
                <SelectContent>
                  {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select defaultValue="Januari">
                <SelectTrigger className="h-10 border-gray-200 flex-1">
                  <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select defaultValue="1995">
                <SelectTrigger className="h-10 border-gray-200 flex-1">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Save Button Container */}
            <div />
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#ee4d2d] hover:bg-[#d73211] text-white px-8 h-10 text-sm font-medium"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </form>

        {/* Right Side: Avatar Upload */}
        <div className="flex flex-col items-center gap-6 md:w-64 md:border-l border-gray-100 pl-0 md:pl-12 pt-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
              <User className="w-12 h-12 text-gray-300" />
            </div>
            <button className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button variant="outline" size="sm" className="bg-white border-gray-200 text-sm px-4">
              Pilih Gambar
            </Button>
            <div className="text-center text-xs text-gray-400 leading-normal">
              <p>Ukuran gambar: maks. 1 MB</p>
              <p>Format gambar: .JPEG, .PNG</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
