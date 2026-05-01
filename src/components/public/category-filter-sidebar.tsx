'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { normalizeCategoryValues } from '@/lib/products';

interface CategoryItem {
  id: string;
  name: string;
  icon?: string | null;
}

interface CategoryFilterSidebarProps {
  categories: CategoryItem[];
}

export function CategoryFilterSidebar({ categories }: CategoryFilterSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategories = normalizeCategoryValues(searchParams.getAll('category'));
  const selectedCategoryNames = new Set(
    selectedCategories.map((category) => category.toLowerCase()),
  );
  const allCategoriesSelected = categories.every((category) => (
    selectedCategoryNames.has(category.name.trim().toLowerCase())
  ));
  const hasSelectedCategories = selectedCategoryNames.size > 0;

  const buildHref = (categoryName?: string, active?: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    params.delete('category');

    if (categoryName) {
      const nextCategories = active
        ? selectedCategories.filter((category) => category.toLowerCase() !== categoryName.trim().toLowerCase())
        : [...selectedCategories, categoryName];

      nextCategories.forEach((category) => {
        params.append('category', category);
      });
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  if (!categories.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[#acb4b1] text-[12px] font-semibold uppercase tracking-[0.6px]">
        Kategori
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => router.push(buildHref(), { scroll: false })}
          className="flex items-center gap-3 cursor-pointer text-left"
        >
          <input
            type="checkbox"
            checked={!hasSelectedCategories || allCategoriesSelected}
            readOnly
            className="h-4 w-4 shrink-0 accent-[#166534] pointer-events-none"
          />
          <span className="text-[#59615f] text-sm">Semua</span>
        </button>

        {categories.map((cat) => {
          const isActive = selectedCategoryNames.has(cat.name.trim().toLowerCase());

          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => router.push(buildHref(cat.name, isActive), { scroll: false })}
              className="flex items-center gap-3 cursor-pointer text-left"
            >
              <input
                type="checkbox"
                checked={isActive}
                readOnly
                className="h-4 w-4 shrink-0 accent-[#166534] pointer-events-none"
              />
              <span className="text-[#59615f] text-sm">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
