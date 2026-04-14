'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { PaginationMeta } from '@/types';
import { cn } from '@/lib/utils';

interface CatalogPaginationProps {
  pagination: PaginationMeta;
  anchorId?: string;
}

const buildPageItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageSet = new Set<number>([1, totalPages, currentPage]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) {
      pageSet.add(page);
    }
  }

  if (currentPage <= 3) {
    pageSet.add(2);
    pageSet.add(3);
    pageSet.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pageSet.add(totalPages - 1);
    pageSet.add(totalPages - 2);
    pageSet.add(totalPages - 3);
  }

  const sortedPages = [...pageSet]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items: Array<number | 'ellipsis'> = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push('ellipsis');
    }

    items.push(page);
  });

  return items;
};

export function CatalogPagination({ pagination, anchorId }: CatalogPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pagination.totalPages <= 1) {
    return null;
  }

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }

    const queryString = params.toString();
    const hash = anchorId ? `#${anchorId}` : '';
    return queryString ? `${pathname}?${queryString}${hash}` : `${pathname}${hash}`;
  };

  const pageItems = buildPageItems(pagination.page, pagination.totalPages);

  return (
    <div className="flex flex-col items-center gap-3 pt-4">
      <div className="flex items-center justify-center gap-2">
        <Link
          href={buildHref(Math.max(1, pagination.page - 1))}
          aria-disabled={pagination.page === 1}
          className={cn(
            'rounded-lg p-2 leading-none transition-colors',
            pagination.page === 1
              ? 'pointer-events-none text-[#cbd5e1]'
              : 'text-[#64748b] hover:bg-[#f1f5f9]'
          )}
        >
          ‹
        </Link>

        {pageItems.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-10 w-10 items-center justify-center text-[#94a3b8]"
              >
                ...
              </span>
            );
          }

          const isActive = item === pagination.page;

          return (
            <Link
              key={item}
              href={buildHref(item)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg font-medium transition-colors',
                isActive
                  ? 'bg-[#166534] font-bold text-white'
                  : 'text-[#64748b] hover:bg-[#f1f5f9]'
              )}
            >
              {item}
            </Link>
          );
        })}

        <Link
          href={buildHref(Math.min(pagination.totalPages, pagination.page + 1))}
          aria-disabled={pagination.page === pagination.totalPages}
          className={cn(
            'rounded-lg p-2 leading-none transition-colors',
            pagination.page === pagination.totalPages
              ? 'pointer-events-none text-[#cbd5e1]'
              : 'text-[#64748b] hover:bg-[#f1f5f9]'
          )}
        >
          ›
        </Link>
      </div>

      <p className="text-sm text-[#64748b]">
        Halaman {pagination.page} dari {pagination.totalPages}
      </p>
    </div>
  );
}
