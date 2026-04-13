'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShoppingBag, Home, Sparkles, Smartphone, Shirt, PlusCircle, Gamepad, Car } from 'lucide-react';
import Link from 'next/link';

// Fallback icons if the category doesn't have an icon or we need default colors
const fallbackIcons = [ShoppingBag, Home, Sparkles, Smartphone, Shirt, PlusCircle, Gamepad, Car];
const fallbackColors = [
  'bg-orange-100 text-orange-600',
  'bg-blue-100 text-blue-600',
  'bg-teal-100 text-teal-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-red-100 text-red-600',
  'bg-indigo-100 text-indigo-600',
  'bg-gray-100 text-gray-600'
];

interface CategoryItem {
  id: string;
  name: string;
  icon?: string | null;
}

interface CategoryHorizontalListProps {
  categories: CategoryItem[];
}

export function CategoryHorizontalList({ categories }: CategoryHorizontalListProps) {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category')?.trim().toLowerCase();
  const buildHref = (categoryName?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (categoryName) {
      params.set('category', categoryName);
    } else {
      params.delete('category');
    }

    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  };

  if (!categories || categories.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[#2d3432] font-bold text-base md:text-lg flex items-center gap-1 uppercase tracking-tight">
          <span className="w-1.5 h-6 bg-[#166534] rounded-full mr-2" />
          Kategori Pilihan
        </h3>
      </div>
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="flex items-start gap-6 px-2 min-w-max">
          <Link
            href={buildHref()}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div
              className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${
                !selectedCategory ? 'bg-[#166534] text-white' : 'bg-[#f1f5f9] text-[#166534]'
              }`}
            >
              <span className="text-[11px] md:text-xs font-bold">All</span>
            </div>
            <span className="text-[11px] md:text-xs font-medium text-[#2d3432] text-center max-w-16 leading-tight text-wrap">
              Semua
            </span>
          </Link>
          {categories.map((cat, index) => {
            const FallbackIcon = fallbackIcons[index % fallbackIcons.length];
            const colorClass = fallbackColors[index % fallbackColors.length];
            const isActive = selectedCategory === cat.name.trim().toLowerCase();

            return (
              <Link
                key={cat.id}
                href={buildHref(cat.name)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <CategoryIcon
                  icon={cat.icon}
                  name={cat.name}
                  colorClass={isActive ? 'bg-[#166534] text-white' : colorClass}
                  FallbackIcon={FallbackIcon}
                />
                <span className="text-[11px] md:text-xs font-medium text-[#2d3432] text-center max-w-16 leading-tight text-wrap">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface CategoryIconProps {
  icon?: string | null;
  name: string;
  colorClass: string;
  FallbackIcon: typeof ShoppingBag;
}

function isDirectImageUrl(url: string) {
  return (
    /^data:image\//i.test(url)
    || /cloudinary\.com/i.test(url)
    || /\.(png|jpe?g|gif|webp|svg|avif|ico)(\?.*)?$/i.test(url)
  );
}

function CategoryIcon({ icon, name, colorClass, FallbackIcon }: CategoryIconProps) {
  const [hasError, setHasError] = useState(false);
  const iconUrl = icon?.trim();
  const canLoadFromUrl = !!iconUrl && isDirectImageUrl(iconUrl);
  const proxiedIconUrl = iconUrl
    && canLoadFromUrl
    ? `/api/image-proxy?url=${encodeURIComponent(iconUrl)}`
    : null;
  const shouldShowImage = !!proxiedIconUrl && !hasError;

  return (
    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm overflow-hidden ${colorClass}`}>
      {shouldShowImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proxiedIconUrl}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <FallbackIcon className="w-6 h-6 md:w-7 md:h-7" />
      )}
    </div>
  );
}
