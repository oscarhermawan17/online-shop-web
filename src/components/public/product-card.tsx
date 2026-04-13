'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah, getPlaceholderImage, getThumbnailUrl } from '@/lib/utils';
import type { ProductListItem } from '@/types';

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasVariants = product.variants && product.variants.length > 0;
  const primaryImage = product.images?.[0]?.imageUrl;
  const imageUrl = primaryImage
    ? getThumbnailUrl(primaryImage, 400)
    : getPlaceholderImage(400, 400);

  const getPriceDisplay = () => {
    if (!hasVariants) {
      return formatRupiah(product.basePrice);
    }
    const prices = product.variants.map((v) => v.price ?? v.priceOverride ?? product.basePrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return formatRupiah(minPrice);
    return `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
  };

  const isLowStock = product.stock > 0 && product.stock <= 20;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories = (product as any).categories as { name: string }[] | undefined;
  const categoryNames = categories?.map((c) => c.name).join(', ');

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col isolate hover:shadow-md transition-shadow h-full">
        {/* Image */}
        <div className="bg-[#f1f4f2] relative overflow-clip z-2">
          <div className="relative aspect-square w-full">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          </div>
          {isLowStock && (
            <div className="absolute left-2 top-2">
              <span className="bg-[#f9fbb7] text-[#5e602c] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Stok Tipis
              </span>
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="bg-[#f1f4f2] text-[#757c7a] text-xs font-semibold px-3 py-1 rounded-full border border-[#acb4b1]">
                Stok Habis
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 z-1 flex-1">
          {categoryNames && (
            <p className="text-[#acb4b1] text-[10px] font-semibold uppercase tracking-wide">
              {categoryNames}
            </p>
          )}

          <h3 className="text-[#2d3432] text-sm font-medium leading-5 line-clamp-2 min-h-[40px]">
            {product.name}
          </h3>

          <div className="flex flex-col gap-2 mt-auto">
            <div>
              <p className="text-[#006f1d] text-lg font-extrabold leading-7">{getPriceDisplay()}</p>
              <p className="text-[#757c7a] text-[10px] leading-[15px]">/ {product.unit?.name || 'pcs'}</p>
            </div>

            <div className="flex items-center justify-between pb-1">
              <p className="text-[#59615f] text-[10px] font-medium">
                Tersedia:{' '}
                <span className="text-[#006f1d] font-bold">
                  {product.stock > 500 ? '500+' : product.stock}
                </span>
              </p>
              {hasVariants && (
                <span className="bg-[#eaefec] text-[#757c7a] text-[10px] px-1.5 py-0.5 rounded">
                  {product.variants.length} Varian
                </span>
              )}
            </div>

            <button
              className="bg-[#91f78e] text-[#005e17] text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#7de07a] transition-colors w-full"
            >
              <ShoppingCart className="w-3 h-3" />
              Tambah
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="aspect-square bg-[#f1f4f2]">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <Skeleton className="h-3 w-16 bg-[#f1f4f2]" />
        <Skeleton className="h-4 w-full bg-[#f1f4f2]" />
        <Skeleton className="h-4 w-2/3 bg-[#f1f4f2]" />
        <Skeleton className="h-6 w-1/2 bg-[#f1f4f2] mt-1" />
        <Skeleton className="h-8 w-full bg-[#f1f4f2] rounded-lg mt-1" />
      </div>
    </div>
  );
}
