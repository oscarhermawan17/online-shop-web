'use client';

import Image from 'next/image';
import { getOptimizedImageUrl, getPlaceholderImage } from '@/lib/utils';
import type { OrderItem } from '@/types';

interface OrderItemImageProps {
  item: OrderItem;
  size?: number;
  className?: string;
}

export function OrderItemImage({ item, size = 64, className = 'object-contain' }: OrderItemImageProps) {
  const imgSrc = item.imageUrl
    ? getOptimizedImageUrl(item.imageUrl, size)
    : getPlaceholderImage(size, size);

  return (
    <Image
      src={imgSrc}
      alt={item.productName}
      fill
      className={className}
      sizes={`${size}px`}
    />
  );
}
