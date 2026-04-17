'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { formatRupiah } from '@/lib/utils';

const formatNumber = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  if (!cleanValue) return '';
  return formatRupiah(parseInt(cleanValue, 10));
};

const parseFormattedNumber = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue ? parseInt(cleanValue, 10) : null;
};

interface PriceRangeFilterFormProps {
  pathname: string;
  searchParamsString: string;
  initialMinPrice: string;
  initialMaxPrice: string;
}

function PriceRangeFilterForm({
  pathname,
  searchParamsString,
  initialMinPrice,
  initialMaxPrice,
}: PriceRangeFilterFormProps) {
  const router = useRouter();
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setter(formatNumber(rawValue));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParamsString);
    params.delete('page');
    let minValue = parseFormattedNumber(minPrice);
    let maxValue = parseFormattedNumber(maxPrice);

    if (minValue !== null && maxValue !== null && minValue > maxValue) {
      [minValue, maxValue] = [maxValue, minValue];
    }

    if (minValue !== null) {
      params.set('minPrice', String(minValue));
    } else {
      params.delete('minPrice');
    }

    if (maxValue !== null) {
      params.set('maxPrice', String(maxValue));
    } else {
      params.delete('maxPrice');
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  return (
    <form className="flex flex-col gap-3 pt-2" onSubmit={handleSubmit}>
      <p className="text-[#acb4b1] text-[12px] font-semibold uppercase tracking-[0.6px]">
        Rentang Harga (IDR)
      </p>
      <div className="flex flex-col gap-3">
        <div className="group">
          <input
            type="text"
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => handleInputChange(e, setMinPrice)}
            placeholder="Min"
            className="bg-white border border-[#e2e8f0] rounded-lg px-3 py-2 text-[13px] w-full outline-none focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all placeholder:text-[#cbd5e1] shadow-sm font-medium"
          />
        </div>
        <div className="group">
          <input
            type="text"
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => handleInputChange(e, setMaxPrice)}
            placeholder="Max"
            className="bg-white border border-[#e2e8f0] rounded-lg px-3 py-2 text-[13px] w-full outline-none focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all placeholder:text-[#cbd5e1] shadow-sm font-medium"
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-1 w-full border border-[#166534] text-[#166534] hover:bg-[#166534] hover:text-white py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm active:shadow-none"
      >
        Terapkan Harga
      </button>
    </form>
  );
}

export function PriceRangeFilter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const initialMinPrice = formatNumber(searchParams.get('minPrice') || '');
  const initialMaxPrice = formatNumber(searchParams.get('maxPrice') || '');

  return (
    <PriceRangeFilterForm
      key={`${searchParamsString}|${initialMinPrice}|${initialMaxPrice}`}
      pathname={pathname}
      searchParamsString={searchParamsString}
      initialMinPrice={initialMinPrice}
      initialMaxPrice={initialMaxPrice}
    />
  );
}
