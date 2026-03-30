'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useCustomerAuthStore } from '@/stores';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LogOut, 
  User as UserIcon, 
  Settings, 
  Heart,
  ShoppingCart,
  Search,
  MessageCircle,
  Camera
} from 'lucide-react';

interface HeaderProps {
  storeName: string;
}

export function Header({ storeName }: HeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const isCustomerLoggedIn = useCustomerAuthStore((state) => state.isAuthenticated);
  const customerName = useCustomerAuthStore((state) => state.customer?.name);
  const logout = useCustomerAuthStore((state) => state.logout);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;
  const loggedIn = mounted && isCustomerLoggedIn();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 border-b border-black/6 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo - Hidden on mobile search view */}
          <Link href="/" className="hidden md:block text-[#166534] font-bold text-xl leading-7 shrink-0">
            {storeName}
          </Link>

          {/* Search Bar - Always visible now */}
          <div className="flex-1 flex items-center bg-[#f1f5f9] rounded-lg px-3 py-1.5 md:py-2 group focus-within:ring-2 focus-within:ring-[#166534]/20 transition-all">
            <Search className="w-4 h-4 md:w-4.5 md:h-4.5 text-[#64748b]" />
            <input
              type="text"
              placeholder="Cari di Toko ini..."
              className="bg-transparent border-none outline-none flex-1 px-2 text-sm md:text-base text-[#1e293b] placeholder-[#94a3b8]"
            />
            <button className="p-1 hover:bg-black/5 rounded-full transition-colors">
              <Camera className="w-4 h-4 md:w-4.5 md:h-4.5 text-[#64748b]" />
            </button>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 h-6.5">
            <Link
              href="/#products"
              className="text-[#166534] font-semibold text-base border-b-2 border-[#166534] pb-0.5"
            >
              Produk
            </Link>
            <Link
              href="#"
              className="text-[#64748b] font-normal text-base hover:text-[#166534] transition-colors"
            >
              Tentang
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-[#166534]" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-[#dc2626] text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center border-2 border-white">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Chat - New */}
            <Link href="/chat" className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-[#166534]" />
              <span className="absolute top-1 right-1 bg-[#dc2626] text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center border-2 border-white">
                4
              </span>
            </Link>

            {/* Login / Profile - Desktop Only or simplified */}
            <div className="hidden md:block">
              {loggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 bg-[#166534] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#115e59] transition-colors outline-none">
                      <UserIcon className="h-4 w-4" />
                      <span className="truncate max-w-25">{customerName ?? 'Akun'}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/dashboard" className="flex items-center w-full">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profil Saya</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/dashboard/orders" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Pesanan Saya</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Voucher Saya</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="md:hidden lg:block" />
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/login"
                  className="bg-[#166534] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#115e59] transition-colors"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
