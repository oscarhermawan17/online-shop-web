'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Tag, PlayCircle, Bell, User } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Beranda', icon: Home, exact: true },
  { href: '/deals', label: 'Deals', icon: Tag, exact: false },
  { href: '/live', label: 'Live & Video', icon: PlayCircle, exact: false },
  { href: '/notifications', label: 'Notifikasi', icon: Bell, exact: false },
  { href: '/profile', label: 'Saya', icon: User, exact: false },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] h-[64px] bg-white border-t border-black/10 shadow-[0px_-2px_10px_rgba(0,0,0,0.05)] md:hidden flex items-center justify-around px-2">
      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 min-w-[64px] py-1 transition-all duration-200 ${
              isActive ? 'scale-110' : 'scale-100'
            }`}
          >
            <div className={`relative ${isActive ? 'text-[#166534]' : 'text-[#64748b]'}`}>
              <Icon className="w-6 h-6" />
              {label === 'Notifikasi' && (
                <span className="absolute -top-1 -right-1 bg-[#dc2626] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center border-2 border-white">
                  38
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-medium leading-none ${
                isActive ? 'text-[#166534]' : 'text-[#64748b]'
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
