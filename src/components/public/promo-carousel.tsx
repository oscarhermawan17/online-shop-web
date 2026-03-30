'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const slides = [
  {
    id: 1,
    title: 'Grosir Minyak Goreng\nDiskon s/d 15%',
    subtitle: 'Stok terbatas untuk kebutuhan restoran dan katering.',
    badge: 'PROMO UNGGULAN',
    color: 'bg-[#166534]',
    image: '/home/frederyk/.gemini/antigravity/brain/ef6ea6b0-e329-47ea-b7a0-b49a13e2186a/promo_minyak_goreng_1774835627580.png',
  },
  {
    id: 2,
    title: 'Paket Sembako\nMurah & Hemat',
    subtitle: 'Kebutuhan pokok harga grosir untuk UMKM dan rumah tangga.',
    badge: 'HARGA TERBAIK',
    color: 'bg-[#006f1d]',
    // No image for slide 2, using gradient
  },
  {
    id: 3,
    title: 'Peralatan Rumah\nProduk Berkualitas',
    subtitle: 'Lengkapi dapur Anda dengan peralatan standar resto.',
    badge: 'CUCI GUDANG',
    color: 'bg-[#064e3b]',
    // No image for slide 3, using gradient
  },
];

export function PromoCarousel() {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative group overflow-hidden rounded-2xl w-full h-45 md:h-48">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`w-full shrink-0 relative flex items-center h-full ${slide.color}`}
          >
            {/* Background Overlay */}
            <div className="absolute inset-0 opacity-20 bg-linear-to-br from-white via-transparent to-transparent z-0" />

            {/* Background Image (if any) */}
            {slide.image && (
              <div className="absolute inset-0 z-0 opacity-30 select-none pointer-events-none">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="relative z-10 p-6 md:p-8 w-full">
              <div className="bg-[#f9fbb7] text-[#5e602c] text-[10px] font-bold tracking-[1px] uppercase px-2 py-1 rounded inline-block mb-2 md:mb-3">
                {slide.badge}
              </div>
              <h2 className="text-white font-extrabold text-xl md:text-[30px] md:leading-[37.5px] mb-1 md:mb-3 whitespace-pre-line">
                {slide.title}
              </h2>
              <p className="text-[#eaffe2] text-xs md:text-sm">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${current === i ? 'bg-white w-4' : 'bg-white/40'
              }`}
          />
        ))}
      </div>
    </div>
  );
}
