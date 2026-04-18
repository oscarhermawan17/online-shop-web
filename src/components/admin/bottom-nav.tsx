'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Store, Users, WalletCards, HandCoins } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Beranda', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Product', icon: Package, exact: false },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingCart, exact: false },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users, exact: false },
  { href: '/admin/credit', label: 'Limit', icon: WalletCards, exact: false },
  { href: '/admin/receivables', label: 'Piutang', icon: HandCoins, exact: false },
  { href: '/admin/store', label: 'Toko', icon: Store, exact: false },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-[#f1f5f9] shadow-[0px_-4px_12px_0px_rgba(0,0,0,0.05)] rounded-tl-2xl rounded-tr-2xl overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-full w-max items-center scroll-px-2 px-2 pt-3 pb-4 snap-x snap-mandatory">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 basis-1/5 min-w-[20%] snap-start flex-col items-center gap-0.5 py-1 rounded-2xl transition-colors ${isActive ? 'bg-[#f0fdf4]' : ''}`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#166534]' : 'text-[#64748b]'}`} />
              <span className={`text-[10px] font-medium leading-3.75 ${isActive ? 'text-[#166534]' : 'text-[#64748b]'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
