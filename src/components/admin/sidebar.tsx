'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Store, Users, MapPinned, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Produk', icon: Package, exact: false },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingCart, exact: false },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users, exact: false },
  { href: '/admin/shipping-zones', label: 'Area Pengiriman', icon: MapPinned, exact: false },
  { href: '/admin/store', label: 'Pengaturan Toko', icon: Store, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 min-h-screen bg-[#f8fafc]">
      {/* Branding */}
      <div className="px-4 pt-4 pb-8">
        <div className="px-2 py-4">
          <p className="text-[#14532d] font-bold text-xl tracking-[-0.5px] leading-7">Admin Grosir</p>
          <p className="text-[#64748b] font-medium text-xs leading-4">Manajemen Toko</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-4 flex-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-[#dcfce7] text-[#166534] font-bold'
                  : 'text-[#475569] font-normal hover:bg-[#f1f5f9] hover:text-[#2d3432]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 pt-4 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#a73b21] w-full hover:bg-[rgba(253,121,90,0.08)] transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
