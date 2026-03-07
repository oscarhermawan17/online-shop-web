'use client';

import { PackageOpen, ShoppingBag, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type EmptyStateType = 'products' | 'cart' | 'orders' | 'default';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

const icons: Record<EmptyStateType, React.ReactNode> = {
  products: <PackageOpen className="h-16 w-16 text-muted-foreground/50" />,
  cart: <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />,
  orders: <FileText className="h-16 w-16 text-muted-foreground/50" />,
  default: <Users className="h-16 w-16 text-muted-foreground/50" />,
};

const defaultContent: Record<EmptyStateType, { title: string; description: string }> = {
  products: {
    title: 'Belum Ada Produk',
    description: 'Produk belum tersedia saat ini.',
  },
  cart: {
    title: 'Keranjang Kosong',
    description: 'Anda belum menambahkan produk ke keranjang.',
  },
  orders: {
    title: 'Belum Ada Pesanan',
    description: 'Belum ada pesanan yang masuk.',
  },
  default: {
    title: 'Tidak Ada Data',
    description: 'Data tidak ditemukan.',
  },
};

export function EmptyState({
  type = 'default',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const content = defaultContent[type];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center',
        className
      )}
    >
      {icons[type]}
      <div className="space-y-1">
        <h3 className="font-semibold">{title || content.title}</h3>
        <p className="text-sm text-muted-foreground">
          {description || content.description}
        </p>
      </div>
      {actionLabel && (actionHref || onAction) && (
        <>
          {actionHref ? (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </>
      )}
    </div>
  );
}
