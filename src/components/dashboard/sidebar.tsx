'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  ClipboardList,
  Bell,
  Ticket,
  Pencil,
} from 'lucide-react';
import { useCustomerAuthStore } from '@/stores';
import { cn } from '@/lib/utils';

export function DashboardSidebar() {
  const pathname = usePathname();
  const customer = useCustomerAuthStore((state) => state.customer);

  const menuItems = [
    {
      title: 'Akun Saya',
      icon: <User className="w-5 h-5 text-blue-600" />,
      href: '/dashboard',
      subItems: [
        { title: 'Profil', href: '/dashboard' },
        // { title: 'Bank & Kartu', href: '#' },
        { title: 'Alamat', href: '/dashboard/address' },
        { title: 'Ubah Password', href: '#' },
        // { title: 'Pengaturan Notifikasi', href: '#' },
        // { title: 'Pengaturan Privasi', href: '#' },
      ]
    },
    {
      title: 'Pesanan Saya',
      icon: <ClipboardList className="w-5 h-5 text-blue-600" />,
      href: '/dashboard/orders'
    },
    {
      title: 'Notifikasi',
      icon: <Bell className="w-5 h-5 text-orange-500" />,
      href: '#'
    },
    {
      title: 'Voucher Saya',
      icon: <Ticket className="w-5 h-5 text-red-500" />,
      href: '#'
    }
  ];

  return (
    <aside className="w-48 shrink-0">
      <div className="flex items-center gap-3 py-4 mb-3">
        <div className="h-12 w-12 rounded-full border bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
          <User className="w-6 h-6 text-gray-400" />
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-sm truncate">{customer?.name || 'Pengguna'}</p>
          <Link
            href="/dashboard"
            className="flex items-center text-gray-500 text-xs hover:text-gray-700 mt-1 transition-colors"
          >
            <Pencil className="w-3 h-3 mr-1" />
            Ubah Profil
          </Link>
        </div>
      </div>

      <nav className="space-y-4">
        {menuItems.map((item, index) => {
          const isAkunSaya = item.title === 'Akun Saya';
          const isActive = pathname === item.href || (isAkunSaya && pathname === '/dashboard');

          return (
            <div key={index} className="space-y-2">
              {item.subItems ? (
                <>
                  <div className="flex items-center gap-3 px-1 py-1 text-sm font-medium hover:text-[#ee4d2d] transition-colors cursor-pointer">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  <ul className="pl-8 space-y-2">
                    {item.subItems.map((subItem, subIndex) => {
                      const isSubActive = pathname === subItem.href && (subItem.title === 'Profil' ? pathname === '/dashboard' : true);

                      return (
                        <li key={subIndex}>
                          <Link
                            href={subItem.href}
                            className={cn(
                              "text-sm transition-colors block hover:text-[#ee4d2d]",
                              isSubActive ? "text-[#ee4d2d] font-medium" : "text-gray-600"
                            )}
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-1 py-1 text-sm font-medium transition-colors hover:text-[#ee4d2d]",
                    isActive && !isAkunSaya ? "text-[#ee4d2d]" : "text-gray-900"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
