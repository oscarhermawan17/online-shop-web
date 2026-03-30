'use client';

import { useState } from 'react';

export function PriceRangeFilter() {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const formatNumber = (value: string) => {
    // Remove non-numeric characters except for leading zeros or dots
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(cleanValue));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setter(formatNumber(rawValue));
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="text-[#acb4b1] text-[12px] font-semibold uppercase tracking-[0.6px]">
        Rentang Harga (IDR)
      </p>
      <div className="flex flex-col gap-3">
        <div className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[10px] font-bold pointer-events-none group-focus-within:text-[#166534] transition-colors">
            Rp
          </span>
          <input
            type="text"
            value={minPrice}
            onChange={(e) => handleInputChange(e, setMinPrice)}
            placeholder="Min"
            className="bg-white border border-[#e2e8f0] rounded-lg pl-8 pr-2 py-2 text-[13px] w-full outline-none focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all placeholder:text-[#cbd5e1] shadow-sm font-medium"
          />
        </div>
        <div className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[10px] font-bold pointer-events-none group-focus-within:text-[#166534] transition-colors">
            Rp
          </span>
          <input
            type="text"
            value={maxPrice}
            onChange={(e) => handleInputChange(e, setMaxPrice)}
            placeholder="Max"
            className="bg-white border border-[#e2e8f0] rounded-lg pl-8 pr-2 py-2 text-[13px] w-full outline-none focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all placeholder:text-[#cbd5e1] shadow-sm font-medium"
          />
        </div>
      </div>
      <button className="mt-1 w-full border border-[#166534] text-[#166534] hover:bg-[#166534] hover:text-white py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm active:shadow-none">
        Terapkan Harga
      </button>
    </div>
  );
}
