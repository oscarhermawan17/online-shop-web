'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah, getPlaceholderImage, getThumbnailUrl } from '@/lib/utils';
import type { ProductListItem } from '@/types';

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasVariants = product.variants && product.variants.length > 0;
  const primaryImage = product.images?.[0]?.imageUrl;
  const imageUrl = primaryImage
    ? getThumbnailUrl(primaryImage, 400)
    : getPlaceholderImage(400, 400);

  // Get price range if has variants
  const getPriceDisplay = () => {
    if (!hasVariants) {
      return formatRupiah(product.basePrice);
    }

    const prices = product.variants.map(
      (v) => v.priceOverride ?? product.basePrice
    );
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return formatRupiah(minPrice);
    }

    return `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
  };

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {hasVariants && (
            <Badge
              variant="secondary"
              className="absolute right-2 top-2 text-xs"
            >
              {product.variants.length} Varian
            </Badge>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Badge variant="destructive">Stok Habis</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
            {product.name}
          </h3>
          <p className="mt-2 font-semibold text-primary">{getPriceDisplay()}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-2/3" />
        <Skeleton className="mt-2 h-5 w-1/2" />
      </CardContent>
    </Card>
  );
}
