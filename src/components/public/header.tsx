'use client';

import Link from 'next/link';
import { ShoppingCart, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores';

interface HeaderProps {
  storeName: string;
}

export function Header({ storeName }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-black/[0.06] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between max-w-[1280px] mx-auto px-6 py-3">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[#166534] font-bold text-xl leading-7 shrink-0">
            {storeName}
          </Link>
          <nav className="hidden md:flex items-center gap-6 h-[26px]">
            <Link
              href="/#products"
              className="text-[#166534] font-semibold text-base border-b-2 border-[#166534] pb-0.5 leading-6"
            >
              Produk
            </Link>
            <Link
              href="#"
              className="text-[#475569] font-normal text-base leading-6 hover:text-[#166534] transition-colors"
            >
              Tentang Kami
            </Link>
            <Link
              href="#"
              className="text-[#475569] font-normal text-base leading-6 hover:text-[#166534] transition-colors"
            >
              Kontak
            </Link>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-[576px] px-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Cari kebutuhan harian..."
              className="bg-[#dde4e1] rounded-lg pl-4 pr-10 py-[9px] w-full text-sm text-[#2d3432] placeholder-[#6b7280] outline-none focus:ring-2 focus:ring-[#006f1d]/30"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-[18px] h-[18px] text-[#59615f]" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-5">
          {/* Cart */}
          <Link href="/cart" className="relative p-2 rounded-full hover:bg-[#f1f4f2] transition-colors">
            <ShoppingCart className="w-[19px] h-[19px] text-[#2d3432]" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#a73b21] text-white text-[10px] font-normal rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {/* Masuk Button */}
          <Link
            href="/admin/login"
            className="bg-[#006f1d] text-[#eaffe2] font-semibold text-base px-6 py-2 rounded-lg hover:bg-[#005e17] transition-colors leading-6"
          >
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}
