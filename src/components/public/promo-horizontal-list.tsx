'use client';

import { ProductListItem } from '@/types';
import { ProductCard } from './product-card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PromoHorizontalListProps {
  products: ProductListItem[];
  title: string;
  viewAllHref?: string;
}

export function PromoHorizontalList({
  products,
  title,
  viewAllHref = '/promo',
}: PromoHorizontalListProps) {
  if (products.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[#166534] font-bold text-base md:text-lg flex items-center gap-1 uppercase tracking-tight">
          <span className="w-1.5 h-6 bg-[#166534] rounded-full mr-2" />
          {title}
        </h3>
        <Link href={viewAllHref} className="text-[#166534] text-xs font-semibold hover:underline flex items-center">
          Lihat Semua <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="flex gap-4 px-2 min-w-max pb-4 lg:min-w-0 lg:grid lg:grid-cols-5 lg:gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              className="w-44 md:w-56 shrink-0 transform transition-transform hover:scale-[1.02] lg:w-auto"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
