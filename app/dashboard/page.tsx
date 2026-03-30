'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Camera,
  Settings,
  ShoppingCart,
  MessageCircle,
  ChevronRight,
  Wallet,
  Coins,
  Ticket,
  Download,
  CreditCard,
  BadgePercent,
  ShieldCheck,
  Package,
  Truck,
  Star,
  Banknote,
  UtensilsCrossed,
  Smartphone
} from 'lucide-react';
import { useCustomerAuthStore, useCartStore } from '@/stores';
import { cn } from '@/lib/utils';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';
import { OrderStatusBadge } from '@/components/public/order-status';
import { fetcher } from '@/lib/api';
import type { Order } from '@/types/order';
import useSWR from 'swr';
import { toast } from 'sonner';

export default function ProfilePage() {
  const customer = useCustomerAuthStore((state) => state.customer);

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block">
        <DesktopProfile />
      </div>

      {/* Mobile View */}
      <div className="md:hidden block">
        <MobileDashboard />
      </div>
    </>
  );
}

function DesktopProfile() {
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
    <div className="bg-white rounded-sm shadow-sm p-6 space-y-4">
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
            {/* Username Row */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Username</Label>
            <div className="space-y-1">
              <span className="text-sm text-gray-900 font-medium">{customer?.phone || 'frederykabryan'}</span>
              <p className="text-[11px] text-gray-400">Username hanya dapat diubah satu (1) kali.</p>
            </div>

            {/* Nama Row */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Nama</Label>
            <Input
              placeholder="Masukkan nama"
              defaultValue={customer?.name || ''}
              className="max-w-md h-10 border-gray-200"
            />

            {/* Email Row */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Email</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-900">{maskEmail(customer?.email || 'fa*******@gmail.com')}</span>
              <button type="button" className="text-blue-600 text-sm hover:underline">Ubah</button>
            </div>

            {/* Nomor Telepon Row */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Nomor Telepon</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-900">{customer?.phone || '********3456'}</span>
              <button type="button" className="text-blue-600 text-sm hover:underline">Ubah</button>
            </div>

            {/* Nama Toko Row */}
            <Label className="text-sm text-gray-500 justify-self-start mr-4">Nama Toko</Label>
            <Input
              placeholder="Masukkan nama toko"
              defaultValue="frederykabryan"
              className="max-w-md h-10 border-gray-200"
            />

            {/* Jenis Kelamin Row */}
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

            {/* Tanggal Lahir Row */}
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

            {/* Save Button */}
            <div />
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#166534] hover:bg-[#115e5b] text-white px-8 h-10 text-sm font-medium"
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

function MobileDashboard() {
  const customer = useCustomerAuthStore((state) => state.customer);
  const items = useCartStore((state) => state.items);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [mounted, setMounted] = useState(false);

  const { data: orders } = useSWR<Order[]>('/customer/orders', fetcher);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? items.length : 0;

  const getStatusCount = (statusKeys: string[]) => {
    if (!orders) return 0;
    return orders.filter(order => statusKeys.includes(order.status)).length;
  };

  const statusIcons = [
    { icon: Wallet, label: 'Belum Bayar', status: ['pending_payment'] },
    { icon: Package, label: 'Dikemas', status: ['paid', 'waiting_confirmation'] },
    { icon: Truck, label: 'Dikirim', status: ['shipped'] },
    { icon: Star, label: 'Diterima', status: ['done'] },
  ];

  return (
    <div className="pb-24 bg-[#f5f5f5] min-h-screen">
      {/* Green Header */}
      <div className="bg-[#166534] pt-8 pb-12 px-4 relative overflow-hidden">
        {/* Background pattern placeholder */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="grid grid-cols-4 gap-4 rotate-12 scale-150">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-16 h-16 border-2 border-white rounded-full" />
            ))}
          </div>
        </div>

        {/* Top Navbar items */}
        <div className="flex items-center justify-end text-white mb-6 relative z-10">
          {/* <button className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
            <Smartphone className="w-3.5 h-3.5" />
            Mulai Jual
            <ChevronRight className="w-3.5 h-3.5" />
          </button> */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-1 hover:bg-white/10 rounded-full transition-colors active:scale-90">
              <Settings className="w-5 h-5 text-white" />
            </Link>
            <Link href="/cart" className="p-1 hover:bg-white/10 rounded-full transition-colors active:scale-90 relative">
              <ShoppingCart className="w-5 h-5 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#dc2626] text-white text-[9px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center border-2 border-[#166534]">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
            <Link href="/chat" className="p-1 hover:bg-white/10 rounded-full transition-colors active:scale-90">
              <MessageCircle className="w-5 h-5 text-white" />
            </Link>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex items-start gap-4 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center overflow-hidden">
              <User className="w-10 h-10 text-white" />
            </div>
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-1 border shadow-sm">
              <Camera className="w-3 h-3 text-gray-600" />
            </button>
          </div>
          <div className="text-white space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg leading-tight truncate max-w-37.5">
                {customer?.name || 'frederyk_abryan'}
              </h2>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1">
                Gold
                <ChevronRight className="w-2.5 h-2.5" />
              </span>
            </div>
            {/* <div className="flex items-center gap-4 text-xs opacity-90">
              <span><strong>11</strong> Pengikut</span>
              <span><strong>35</strong> Mengikuti</span>
            </div> */}
          </div>
        </div>
      </div>

      <div className="mt-8 px-4 space-y-3">

        {/* Pesanan Saya */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-50">
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-800">Pesanan Saya</h3>
          </div>
          <div className="grid grid-cols-4 py-4">
            {statusIcons.map((item, i) => {
              const count = getStatusCount(item.status);
              const isActive = activeFilter === item.status[0];

              return (
                <div
                  key={i}
                  onClick={() => setActiveFilter(isActive ? 'all' : item.status[0])}
                  className={cn(
                    "flex flex-col items-center gap-1.5 relative cursor-pointer transition-all active:scale-95",
                    isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn(
                      "w-6 h-6 stroke-[1.5]",
                      isActive ? "text-[#166534]" : "text-gray-600"
                    )} />
                    {count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#166534] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                        {count}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] whitespace-nowrap transition-colors",
                    isActive ? "text-[#166534] font-bold" : "text-gray-600"
                  )}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t border-gray-50">
            <OrderHistoryInline activeStatus={activeFilter} />
          </div>
        </div>

        {/* Keuangan Section */}
      </div>
    </div>
  );
}

function OrderHistoryInline({ activeStatus = 'all' }: { activeStatus?: string }) {
  const { data: orders, isLoading } = useSWR<Order[]>('/customer/orders', fetcher);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  // Filter logic
  const filteredOrders = !orders ? [] : (
    activeStatus === 'all'
      ? orders
      : orders.filter(o => {
        if (activeStatus === 'paid') return o.status === 'paid' || o.status === 'waiting_confirmation';
        return o.status === activeStatus;
      })
  );

  if (filteredOrders.length === 0) {
    const emptyMessages: Record<string, string> = {
      all: 'Belum ada pesanan terbaru',
      pending_payment: 'Belum ada pesanan yang perlu dibayar',
      paid: 'Belum ada pesanan yang sedang dikemas',
      shipped: 'Belum ada pesanan yang dalam pengiriman',
      done: 'Belum ada pesanan yang selesai',
    };

    return (
      <div className="text-center py-8 px-4">
        <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-xs text-gray-400 font-medium">
          {emptyMessages[activeStatus] || emptyMessages.all}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50 flex flex-col bg-white">
      {filteredOrders.slice(0, 3).map((order: Order) => (
        <div key={order.id} className="py-4 first:pt-0">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400">#{order.publicOrderId}</p>
              <p className="text-[11px] text-gray-500">{formatDate(order.createdAt)}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center justify-between mt-2 pt-2">
            <p className="text-sm text-gray-600">{order.items.length} item pesan</p>
            <p className="font-bold text-[#166534] text-sm">{formatCurrency(order.totalAmount)}</p>
          </div>
        </div>
      ))}
      <Link href="/dashboard/orders" className="flex items-center justify-center gap-1 py-1 text-[10px] text-gray-400 hover:text-gray-600">
        Lihat Semua Pesanan
        <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

