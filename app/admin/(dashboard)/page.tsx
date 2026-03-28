'use client';

import Link from 'next/link';
import { Eye, Plus, Bell, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { OrderTable } from '@/components/admin';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { useAdminProducts, useAdminOrders } from '@/hooks';
import { useAdminStore } from '@/hooks/use-store';
import { formatRupiah } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case 'done':
    case 'paid':
    case 'shipped':
      return { bg: '#91f78e', text: '#005e17', label: 'SUKSES' };
    case 'pending_payment':
    case 'waiting_confirmation':
      return { bg: '#f9fbb7', text: '#5e602c', label: 'PROSES' };
    case 'cancelled':
    case 'expired_unpaid':
      return { bg: 'rgba(253,121,90,0.2)', text: '#a73b21', label: 'BATAL' };
    default:
      return { bg: '#e4e9e7', text: '#59615f', label: status.toUpperCase() };
  }
}

function getInitials(name: string | undefined | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

// ─── Date filter pills (desktop, UI only) ────────────────────────────────────

const DATE_FILTERS = ['Hari Ini', 'Kemarin', 'Bulan Ini', 'Bulan Lalu'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { products, isLoading: productsLoading, isError: productsError } = useAdminProducts();
  const { orders, isLoading: ordersLoading, isError: ordersError, mutate: mutateOrders } = useAdminOrders();
  const { store } = useAdminStore();

  if (productsLoading || ordersLoading) return <LoadingPage />;

  if (productsError || ordersError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Data"
        message="Tidak dapat memuat data dashboard"
        onRetry={() => mutateOrders()}
      />
    );
  }

  // ── Computed stats ──
  const totalRevenue = orders
    .filter((o) => o.status === 'paid' || o.status === 'shipped' || o.status === 'done')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeOrders = orders.filter(
    (o) => o.status === 'pending_payment' || o.status === 'waiting_confirmation' || o.status === 'paid' || o.status === 'shipped'
  ).length;

  const completedOrders = orders.filter((o) => o.status === 'done').length;

  const pendingPayments = orders.filter(
    (o) => o.status === 'pending_payment' || o.status === 'waiting_confirmation'
  ).length;

  const successfulOrders = orders.filter(
    (o) => o.status === 'paid' || o.status === 'shipped' || o.status === 'done'
  ).length;

  const recentOrders = orders.slice(0, 5);
  const last10Orders = orders.slice(0, 10);

  const lowStockProducts = [...products]
    .filter((p) => p.stock !== undefined)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
    .slice(0, 3);

  const storeName = store?.name ?? 'Admin Grosir';

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          MOBILE LAYOUT (hidden on md+)
      ═══════════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* Mobile Top Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/[0.06] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between px-6 py-3">
            <span className="text-[#166534] font-bold text-xl leading-7">{storeName}</span>
            <div className="flex items-center gap-4">
              <button className="relative p-1">
                <Bell className="w-5 h-5 text-[#2d3432]" />
              </button>
              <div className="w-8 h-8 bg-[#91f78e] rounded-full flex items-center justify-center">
                <span className="text-[#005e17] text-xs font-bold">A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="pt-20 px-4 pb-8 flex flex-col gap-6 bg-[#f1f4f2] min-h-screen">

          {/* Welcome */}
          <div>
            <p className="text-[#59615f] text-xs font-medium leading-4">Selamat Datang,</p>
            <h1 className="text-[#2d3432] text-2xl font-extrabold tracking-[-0.6px] leading-8">Admin Dashboard</h1>
          </div>

          {/* Stats Bento */}
          <div className="grid grid-cols-2 gap-4">
            {/* Large card: Pendapatan (full width) */}
            <div className="col-span-2 bg-white rounded-2xl p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border border-[rgba(172,180,177,0.1)] relative overflow-hidden">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[#59615f] text-xs font-semibold leading-4">Pendapatan</p>
                <TrendingUp className="w-5 h-5 text-[#006f1d]" />
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-[#006f1d] font-bold text-sm leading-5">Rp</span>
                <span className="text-[#2d3432] font-extrabold text-3xl tracking-[-1.5px] leading-9">
                  {totalRevenue.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#006f1d] text-[10px] font-bold leading-[15px]">+12%</span>
                <span className="text-[#59615f] text-[10px] font-medium leading-[15px]">vs bulan lalu</span>
              </div>
              <div className="absolute bottom-[-16px] right-[-16px] w-24 h-24 bg-[rgba(0,111,29,0.05)] rounded-full blur-3xl" />
            </div>

            {/* Pesanan Aktif */}
            <div className="bg-white rounded-2xl p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border border-[rgba(172,180,177,0.1)] relative">
              <div className="w-10 h-10 bg-[#d5e8cf] rounded-xl flex items-center justify-center mb-4">
                <ShoppingCart className="w-5 h-5 text-[#166534]" />
              </div>
              <p className="text-[#59615f] text-[10px] font-semibold leading-[15px]">Pesanan Aktif</p>
              <p className="text-[#2d3432] text-xl font-bold leading-7">{activeOrders}</p>
            </div>

            {/* Pesanan Selesai */}
            <div className="bg-white rounded-2xl p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border border-[rgba(172,180,177,0.1)] relative">
              <div className="w-10 h-10 bg-[#f9fbb7] rounded-xl flex items-center justify-center mb-4">
                <Package className="w-5 h-5 text-[#5e602c]" />
              </div>
              <p className="text-[#59615f] text-[10px] font-semibold leading-[15px]">Pesanan Selesai</p>
              <p className="text-[#2d3432] text-xl font-bold leading-7">{completedOrders}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
            <p className="text-[rgba(45,52,50,0.8)] text-sm font-bold leading-5 px-1">Aksi Cepat</p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 bg-[#006f1d] text-[#eaffe2] font-bold text-sm px-4 py-3 rounded-xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] self-start"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </Link>
          </div>

          {/* Recent Transactions */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[rgba(45,52,50,0.8)] text-sm font-bold leading-5">Transaksi Terakhir</p>
              <Link href="/admin/orders" className="text-[#006f1d] text-[10px] font-bold uppercase tracking-[0.5px] leading-[15px]">
                Lihat Semua
              </Link>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border border-[rgba(172,180,177,0.05)] divide-y divide-[#f1f4f2]">
              {recentOrders.length === 0 ? (
                <p className="text-[#59615f] text-sm p-4 text-center">Belum ada transaksi</p>
              ) : (
                recentOrders.map((order, i) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <div
                      key={order.id}
                      className={`flex items-center gap-4 p-4 ${i % 2 === 1 ? 'bg-[#f1f4f2]' : 'bg-white'}`}
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-[#eaefec] rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-[#59615f] text-sm font-bold">
                          {getInitials(order.customerName)}
                        </span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[#2d3432] text-sm font-bold leading-5 truncate">{order.customerName}</p>
                        <p className="text-[#59615f] text-[10px] font-normal leading-[15px]">
                          #{order.publicOrderId} • {timeAgo(order.createdAt)}
                        </p>
                      </div>
                      {/* Amount + Status */}
                      <div className="flex flex-col items-end shrink-0">
                        <p className="text-[#006f1d] text-sm font-bold leading-5">{formatRupiah(order.totalAmount)}</p>
                        <span
                          className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm leading-3"
                          style={{ background: badge.bg, color: badge.text }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* FABs */}
        <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-40">
          <button className="w-12 h-12 bg-white rounded-full border border-[rgba(0,111,29,0.1)] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#2d3432]" />
          </button>
          <Link
            href="/admin/products/new"
            className="w-14 h-14 bg-[#006f1d] rounded-full shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1)] flex items-center justify-center"
          >
            <Plus className="w-6 h-6 text-white" />
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP LAYOUT (hidden below md)
      ═══════════════════════════════════════════════════════════ */}
      <div className="hidden md:block space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#2d3432] text-2xl font-extrabold tracking-[-0.6px] leading-8">Ringkasan Dashboard</h1>
            <p className="text-[#59615f] text-sm leading-5">Selamat datang kembali, Admin {storeName}.</p>
          </div>
          {/* Date filter pills */}
          <div className="flex items-center bg-[#e4e9e7] rounded-xl p-1 gap-0">
            {DATE_FILTERS.map((label, i) => (
              <button
                key={label}
                className={`px-4 py-1.5 text-xs rounded-lg transition-colors ${
                  i === 0
                    ? 'bg-white text-[#006f1d] font-semibold shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'
                    : 'text-[#59615f] font-medium'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-6">
          {/* Total Pesanan */}
          <div className="bg-white rounded-xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] relative">
            <div className="flex items-center justify-between mb-14">
              <div className="w-9 h-9 bg-[#d5e8cf] rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-[#166534]" />
              </div>
              <span className="bg-[rgba(145,247,142,0.2)] text-[#006f1d] text-xs font-semibold px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <p className="text-[#59615f] text-sm font-medium leading-5">Total Pesanan</p>
            <p className="text-[#2d3432] text-3xl font-extrabold leading-9">{orders.length.toLocaleString('id-ID')}</p>
          </div>

          {/* Menunggu Pembayaran */}
          <div className="bg-white rounded-xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="mb-14">
              <div className="w-9 h-9 bg-[#f9fbb7] rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#5e602c]" />
              </div>
            </div>
            <p className="text-[#59615f] text-sm font-medium leading-5">Menunggu Pembayaran</p>
            <p className="text-[#2d3432] text-3xl font-extrabold leading-9">{pendingPayments}</p>
          </div>

          {/* Penjualan Berhasil */}
          <div className="bg-white rounded-xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="mb-14">
              <div className="w-9 h-9 bg-[#d5e8cf] rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-[#166534]" />
              </div>
            </div>
            <p className="text-[#59615f] text-sm font-medium leading-5">Penjualan Berhasil</p>
            <p className="text-[#2d3432] text-3xl font-extrabold leading-9">{successfulOrders.toLocaleString('id-ID')}</p>
          </div>

          {/* Total Pendapatan — green gradient */}
          <div className="rounded-xl p-6 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] relative overflow-hidden"
            style={{ background: 'linear-gradient(143deg, #006f1d 0%, #00611a 100%)' }}>
            <div className="mb-14">
              <div className="w-9 h-9 bg-[rgba(255,255,255,0.15)] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#eaffe2]" />
              </div>
            </div>
            <p className="text-[rgba(234,255,226,0.8)] text-sm font-medium leading-5">Total Pendapatan (IDR)</p>
            <p className="text-[#eaffe2] text-2xl font-extrabold leading-8">{formatRupiah(totalRevenue)}</p>
          </div>
        </div>

        {/* Transaction table */}
        <div className="bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#eaefec]">
            <h2 className="text-[#2d3432] text-lg font-bold leading-7">10 Transaksi Terakhir</h2>
            <Link href="/admin/orders" className="text-[#006f1d] text-sm font-semibold leading-5">
              Lihat Semua
            </Link>
          </div>
          {/* Table header */}
          <div className="grid grid-cols-[180px_1fr_200px_172px_88px] bg-[rgba(241,244,242,0.5)]">
            {['ID PESANAN', 'PELANGGAN', 'JUMLAH', 'STATUS', 'AKSI'].map((col) => (
              <div key={col} className="px-6 py-4 text-[#59615f] text-xs font-bold tracking-[0.6px] uppercase">
                {col}
              </div>
            ))}
          </div>
          {/* Rows */}
          {last10Orders.length === 0 ? (
            <p className="text-[#59615f] text-sm p-6 text-center">Belum ada transaksi</p>
          ) : (
            last10Orders.map((order) => {
              const badge = getStatusBadge(order.status);
              const initials = getInitials(order.customerName);
              const bgColor = ['#d5e8cf', '#e4e9e7', '#f9fbb7'][initials.charCodeAt(0) % 3];
              const textColor = bgColor === '#d5e8cf' ? '#465643' : '#59615f';
              return (
                <div key={order.id} className="grid grid-cols-[180px_1fr_200px_172px_88px] border-t border-[#eaefec] items-center">
                  <div className="px-6 py-7">
                    <span className="text-[#2d3432] text-base font-medium">#{order.publicOrderId}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0"
                      style={{ background: bgColor, color: textColor }}>
                      {initials}
                    </div>
                    <span className="text-[#2d3432] text-sm font-medium">{order.customerName}</span>
                  </div>
                  <div className="px-6 py-7">
                    <span className="text-[#2d3432] text-sm font-semibold">{formatRupiah(order.totalAmount)}</span>
                  </div>
                  <div className="px-6 py-7">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.25px]"
                      style={{ background: badge.bg, color: badge.text }}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="pr-6 py-4">
                    <Link href={`/admin/orders/${order.id}`}
                      className="p-2 rounded-lg hover:bg-[#f1f4f2] transition-colors inline-flex">
                      <Eye className="w-4 h-4 text-[#006f1d]" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom bento */}
        <div className="grid grid-cols-3 gap-8">
          {/* Bar chart — Tren Penjualan Mingguan */}
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <h3 className="text-[#2d3432] text-lg font-bold leading-7 mb-6">Tren Penjualan Mingguan</h3>
            <div className="flex items-end justify-between h-64 px-2">
              {[
                { day: 'Sen', height: 40 },
                { day: 'Sel', height: 65 },
                { day: 'Rab', height: 55 },
                { day: 'Kam', height: 85 },
                { day: 'Jum', height: 95 },
                { day: 'Sab', height: 45 },
                { day: 'Min', height: 30 },
              ].map(({ day, height }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 relative">
                  <div
                    className="w-full rounded-t-lg bg-[#006f1d] relative"
                    style={{ height: `${height}%`, opacity: height / 100 + 0.2 }}
                  >
                    <div className="absolute inset-0 rounded-t-lg bg-[rgba(145,247,142,0.2)]" />
                  </div>
                  <span className="text-[#59615f] text-[10px] font-bold leading-[15px]">{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stok Menipis */}
          <div className="bg-white rounded-xl p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-6">
            <h3 className="text-[#2d3432] text-lg font-bold leading-7">Stok Menipis</h3>
            <div className="flex flex-col gap-4">
              {lowStockProducts.length === 0 ? (
                <p className="text-[#59615f] text-sm">Semua stok aman</p>
              ) : (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="bg-[#f1f4f2] rounded-lg h-[72px] relative flex items-center">
                    <div className="absolute left-3 w-0.5 h-12 bg-white border border-[rgba(172,180,177,0.1)] rounded-lg" />
                    <div className="ml-8 mr-16 flex-1 min-w-0">
                      <p className="text-[#2d3432] text-sm font-bold leading-5 truncate">{product.name}</p>
                      <p className="text-[#59615f] text-xs font-normal leading-4">Sisa {product.stock ?? 0}</p>
                    </div>
                    <div className="absolute right-3 bg-[#f9fbb7] px-2 py-1 rounded-lg">
                      <p className="text-[#5e602c] text-[10px] font-bold leading-[15px] text-center">Pesan<br />Lagi</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/admin/products"
              className="bg-[#e4e9e7] text-[#2d3432] text-sm font-semibold text-center py-2.5 rounded-lg hover:bg-[#d5e0db] transition-colors"
            >
              Lihat Inventori Lengkap
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
