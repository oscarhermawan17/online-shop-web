'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Eye, Package, ShoppingBag, Truck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/public/order-status';
import {
  formatRupiah,
  formatDate,
  formatDateOnly,
  getOptimizedImageUrl,
  getShippingShiftLabel,
} from '@/lib/utils';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  /** URL prefix for detail link. Defaults to order detail by publicOrderId. */
  detailHref?: string;
  /** Extra content rendered in the footer (e.g. action buttons). */
  footerActions?: React.ReactNode;
  /** Whether to show customer name in the header (admin view). */
  showCustomer?: boolean;
  /** Whether to show shipping assignment summary (admin view). */
  showShippingSummary?: boolean;
}

export function OrderCard({
  order,
  detailHref,
  footerActions,
  showCustomer = false,
  showShippingSummary = false,
}: OrderCardProps) {
  const maxItemsPreview = 3;
  const visibleItems = order.items.slice(0, maxItemsPreview);
  const remainingCount = order.items.length - maxItemsPreview;
  const href = detailHref ?? `/order/${order.publicOrderId}`;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-semibold">
                  {order.publicOrderId}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {showCustomer && order.customerName
                  ? `${order.customerName} \u00B7 `
                  : ''}
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <Link href={href}>
            <Button variant="ghost" size="sm" className="shrink-0">
              <Eye className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Detail</span>
            </Button>
          </Link>
        </div>

        {/* Items Preview */}
        <div className="divide-y">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-4 py-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={getOptimizedImageUrl(item.imageUrl, 100)}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.productName}
                </p>
                {item.variantDescription && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Variasi: {item.variantDescription}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  x{item.quantity}
                </p>
              </div>

              <div className="text-right shrink-0">
                {item.originalPrice && item.originalPrice > item.price ? (
                  <>
                    <p className="text-xs text-muted-foreground line-through">
                      {formatRupiah(item.originalPrice)}
                    </p>
                    <p className="text-sm font-semibold text-orange-600">
                      {formatRupiah(item.price)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-semibold">
                    {formatRupiah(item.price)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {remainingCount > 0 && (
            <div className="px-4 py-2 text-center">
              <Link
                href={href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                +{remainingCount} produk lainnya
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t px-4 py-3 bg-muted/20 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            {showShippingSummary && order.shippingAssignment && (
              <div className="rounded-lg border bg-background/80 px-3 py-2">
                <p className="text-xs text-muted-foreground">Jadwal Pengiriman</p>
                <div className="mt-1 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {getShippingShiftLabel({
                        name: order.shippingAssignment.shiftName,
                        startTime: order.shippingAssignment.shiftStartTime,
                        endTime: order.shippingAssignment.shiftEndTime,
                        shiftLabel: order.shippingAssignment.shiftLabel,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateOnly(order.shippingAssignment.deliveryDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <span>{order.shippingAssignment.driverName}</span>
                  </div>
                </div>
              </div>
            )}
            {footerActions ? <div className="flex flex-wrap gap-2">{footerActions}</div> : null}
          </div>
          <div className="text-right sm:ml-auto">
            <p className="text-xs text-muted-foreground">Total Pesanan</p>
            <p className="text-lg font-bold text-primary">
              {formatRupiah(order.totalAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
