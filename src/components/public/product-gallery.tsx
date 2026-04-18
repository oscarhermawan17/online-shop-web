'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn, getOptimizedImageUrl, getPlaceholderImage } from '@/lib/utils';
import type { ProductImage } from '@/types';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  selectedImageUrl?: string | null;
  selectedImageAlt?: string | null;
}

export function ProductGallery({
  images,
  productName,
  selectedImageUrl,
  selectedImageAlt,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const hasImages = sortedImages.length > 0;
  const mainImageUrl = selectedImageUrl || sortedImages[selectedIndex]?.imageUrl;

  const mainImage = mainImageUrl
    ? getOptimizedImageUrl(mainImageUrl, 800)
    : getPlaceholderImage(800, 800);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={mainImage}
          alt={selectedImageAlt || sortedImages[selectedIndex]?.altText || productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {!selectedImageUrl && hasImages && sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all',
                selectedIndex === index
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground/50'
              )}
            >
              <Image
                src={getOptimizedImageUrl(image.imageUrl, 100)}
                alt={image.altText || `${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
