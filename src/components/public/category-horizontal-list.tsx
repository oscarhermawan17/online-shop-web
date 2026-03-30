'use client';

import { ShoppingBag, Home, Sparkles, Smartphone, Shirt, PlusCircle, Gamepad, Car } from 'lucide-react';
import Link from 'next/link';

const categories = [
  { id: 1, label: 'Sembako', icon: ShoppingBag, color: 'bg-orange-100 text-orange-600' },
  { id: 2, label: 'Peralatan', icon: Home, color: 'bg-blue-100 text-blue-600' },
  { id: 3, label: 'Kebersihan', icon: Sparkles, color: 'bg-teal-100 text-teal-600' },
  { id: 4, label: 'Elektronik', icon: Smartphone, color: 'bg-purple-100 text-purple-600' },
  { id: 5, label: 'Fashion', icon: Shirt, color: 'bg-pink-100 text-pink-600' },
  { id: 6, label: 'Kesehatan', icon: PlusCircle, color: 'bg-red-100 text-red-600' },
  { id: 7, label: 'Hobi', icon: Gamepad, color: 'bg-indigo-100 text-indigo-600' },
  { id: 8, label: 'Otomotif', icon: Car, color: 'bg-gray-100 text-gray-600' },
];

export function CategoryHorizontalList() {
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
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/#products?category=${cat.label}`}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${cat.color}`}>
                <cat.icon className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <span className="text-[11px] md:text-xs font-medium text-[#2d3432] text-center max-w-16 leading-tight text-wrap">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
