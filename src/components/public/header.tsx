'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { useCartStore, useCustomerAuthStore } from '@/stores';
import api from '@/lib/api';
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
  Loader2,
} from 'lucide-react';

interface HeaderProps {
  storeName: string;
}

interface ProductSearchSuggestion {
  value: string;
  type: 'product' | 'category' | 'unit';
}

const suggestionTypeLabel: Record<ProductSearchSuggestion['type'], string> = {
  product: 'Produk',
  category: 'Kategori',
  unit: 'Satuan',
};

export function Header({ storeName }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSearchSuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const items = useCartStore((state) => state.items);
  const isCustomerLoggedIn = useCustomerAuthStore((state) => state.isAuthenticated);
  const customerName = useCustomerAuthStore((state) => state.customer?.name);
  const logout = useCustomerAuthStore((state) => state.logout);
  const activeQuery = searchParams.get('q') ?? '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSearchQuery(activeQuery);
    setIsSuggestionsOpen(false);
    setIsSearchFocused(false);
  }, [activeQuery]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      setIsSuggestionsOpen(false);
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSuggestionsLoading(true);
        const response = await api.get<{ data: ProductSearchSuggestion[] }>('/products/suggestions', {
          params: { q: trimmedQuery },
        });

        if (!isCancelled) {
          setSuggestions(response.data.data ?? []);

          if (isSearchFocused) {
            setIsSuggestionsOpen(true);
          }
        }
      } catch (error) {
        const axiosError = error as AxiosError;

        if (!isCancelled && axiosError.code !== 'ERR_CANCELED') {
          setSuggestions([]);
        }
      } finally {
        if (!isCancelled) {
          setIsSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, isSearchFocused]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setIsSearchFocused(false);
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  const totalItems = mounted ? items.length : 0;
  const loggedIn = mounted && isCustomerLoggedIn();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const buildSearchHref = (rawQuery: string) => {
    const params = new URLSearchParams(pathname === '/catalog' ? searchParams.toString() : '');
    const query = rawQuery.trim();

    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }

    const queryString = params.toString();
    return queryString ? `/catalog?${queryString}` : '/catalog';
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSearchFocused(false);
    setIsSuggestionsOpen(false);
    router.push(buildSearchHref(searchQuery));
  };

  const handleSuggestionSelect = (value: string) => {
    setSearchQuery(value);
    setIsSearchFocused(false);
    setIsSuggestionsOpen(false);
    router.push(buildSearchHref(value));
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
          <div ref={searchContainerRef} className="relative flex-1">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-[#f1f5f9] rounded-lg px-3 py-1.5 md:py-2 group focus-within:ring-2 focus-within:ring-[#166534]/20 transition-all"
            >
              <Search className="w-4 h-4 md:w-4.5 md:h-4.5 text-[#64748b]" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (suggestions.length > 0) {
                    setIsSuggestionsOpen(true);
                  }
                }}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setIsSearchFocused(true);
                  setIsSuggestionsOpen(event.target.value.trim().length >= 2);
                }}
                placeholder="Cari produk, kategori, atau deskripsi..."
                aria-label="Cari produk"
                className="bg-transparent border-none outline-none flex-1 px-2 text-sm md:text-base text-[#1e293b] placeholder-[#94a3b8]"
                autoComplete="off"
              />
              <button
                type="submit"
                className="rounded-md bg-[#166534] p-2 text-white transition-colors hover:bg-[#115e59]"
                aria-label="Cari"
              >
                <Search className="w-4 h-4 md:w-4.5 md:h-4.5" />
              </button>
            </form>

            {isSearchFocused && isSuggestionsOpen && searchQuery.trim().length >= 2 ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {isSuggestionsLoading ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#64748b]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mencari saran...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.type}-${suggestion.value}`}
                        type="button"
                        onClick={() => handleSuggestionSelect(suggestion.value)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-[#f8fafc]"
                      >
                        <span className="flex items-center gap-2 text-sm text-[#1e293b]">
                          <Search className="h-4 w-4 text-[#94a3b8]" />
                          <span>{suggestion.value}</span>
                        </span>
                        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-medium text-[#64748b]">
                          {suggestionTypeLabel[suggestion.type]}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-[#64748b]">
                    Tidak ada suggestion yang cocok
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 h-6.5">
            <Link
              href="/#products"
              className="text-[#166534] font-semibold text-base border-b-2 border-[#166534] pb-0.5"
            >
              Produk
            </Link>
            {/* <Link
              href="#"
              className="text-[#64748b] font-normal text-base hover:text-[#166534] transition-colors"
            >
              Tentang
            </Link> */}
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
            {/* <Link href="/chat" className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-[#166534]" />
              <span className="absolute top-1 right-1 bg-[#dc2626] text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center border-2 border-white">
                4
              </span>
            </Link> */}

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
