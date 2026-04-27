'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CarouselSlide } from '@/types';
import { getOptimizedImageUrl } from '@/lib/utils';

interface PromoCarouselProps {
  slides: CarouselSlide[];
}

export function PromoCarousel({ slides }: PromoCarouselProps) {
  const [current, setCurrent] = useState(0);
  const safeCurrent = current >= slides.length ? 0 : current;

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative group overflow-hidden rounded-2xl w-full h-52 md:h-60">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${safeCurrent * 100}%)` }}
      >
        {slides.map((slide, index) => {
          const shouldShowText = slide.showText ?? true;
          const badge = slide.badge?.trim();
          const title = slide.title?.trim();
          const subtitle = slide.subtitle?.trim();
          const hasTextContent = Boolean(badge || title || subtitle);

          return (
            <div
              key={slide.id}
              className="relative flex h-full w-full shrink-0 items-center overflow-hidden"
              style={{ backgroundColor: slide.backgroundColor || '#166534' }}
            >
              {slide.imageUrl ? (
                <>
                  <Image
                    src={getOptimizedImageUrl(slide.imageUrl, 1600)}
                    alt={title || `Slide ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={safeCurrent === index}
                  />
                  {shouldShowText && hasTextContent ? (
                    <div className="absolute inset-0 bg-black/40 z-0" />
                  ) : null}
                </>
              ) : null}

              {shouldShowText && hasTextContent ? (
                <>
                  <div className="absolute inset-0 opacity-20 bg-linear-to-br from-white via-transparent to-transparent z-0" />
                  <div className="relative z-10 p-6 md:p-8 w-full">
                    {badge ? (
                      <div className="bg-[#f9fbb7] text-[#5e602c] text-[10px] font-bold tracking-[1px] uppercase px-2 py-1 rounded inline-block mb-2 md:mb-3">
                        {badge}
                      </div>
                    ) : null}
                    {title ? (
                      <h2 className="text-white font-extrabold text-xl md:text-[30px] md:leading-[37.5px] mb-1 md:mb-3 whitespace-pre-line">
                        {title}
                      </h2>
                    ) : null}
                    {subtitle ? (
                      <p className="text-[#eaffe2] text-xs md:text-sm">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      {slides.length > 1 ? (
        <>
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
        </>
      ) : null}

      {slides.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${safeCurrent === i ? 'bg-white w-4' : 'bg-white/40'
                }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
