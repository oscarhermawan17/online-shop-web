'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, ChevronDown, ChevronUp, Clock, Eye, Package, ShoppingBag, Truck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const maxItemsPreview = 3;
  const visibleItems = order.items.slice(0, maxItemsPreview);
  const remainingCount = order.items.length - maxItemsPreview;
  const href = detailHref ?? `/order/${order.publicOrderId}`;
  const productSubtotalAfterDiscount = Math.max(0, order.totalAmount - (order.shippingCost || 0));
  const totalItemDiscount = order.items.reduce((sum, item) => {
    const originalUnitPrice = item.originalPrice && item.originalPrice > item.price
      ? item.originalPrice
      : item.price;
    const computedLineDiscount = Math.max(0, (originalUnitPrice - item.price) * item.quantity);
    const lineDiscount = typeof item.discountAmount === 'number'
      ? item.discountAmount
      : computedLineDiscount;
    return sum + lineDiscount;
  }, 0);
  const productSubtotalBeforeDiscount = productSubtotalAfterDiscount + totalItemDiscount;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md py-0 gap-0">
      <CardContent className="p-0">
        {/* Header - Clickable to toggle expansion */}
        <div 
          className="flex flex-col sm:flex-row sm:items-center justify-between border-b px-4 py-3 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-semibold">
                  {order.publicOrderId}
                </span>
                <OrderStatusBadge status={order.status} />
                <Badge variant="outline">
                  {order.paymentMethod === 'credit' ? 'Credit' : 'Transfer'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {showCustomer && order.customerName
                  ? `${order.customerName} \u00B7 `
                  : ''}
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
            <Link href={href} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="shrink-0 h-8">
                <Eye className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Detail</span>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Items Preview */}
            <div className="divide-y">
              {visibleItems.map((item) => {
                const originalUnitPrice = item.originalPrice && item.originalPrice > item.price
                  ? item.originalPrice
                  : item.price;
                const lineSubtotal = originalUnitPrice * item.quantity;
                const lineTotal = item.price * item.quantity;
                const computedLineDiscount = Math.max(0, lineSubtotal - lineTotal);
                const lineDiscount = typeof item.discountAmount === 'number'
                  ? item.discountAmount
                  : computedLineDiscount;
                const hasDiscount = lineDiscount > 0;

                return (
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
                    {hasDiscount ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRupiah(originalUnitPrice)} {'->'} {formatRupiah(item.price)} x {item.quantity}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRupiah(item.price)} x {item.quantity}
                      </p>
                    )}
                    {item.discountRuleName && hasDiscount ? (
                      <p className="text-[11px] text-green-600 mt-0.5">
                        Rule: {item.discountRuleName}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-right shrink-0">
                    {hasDiscount ? (
                      <>
                        <p className="text-xs text-muted-foreground line-through">
                          {formatRupiah(lineSubtotal)}
                        </p>
                        <p className="text-sm font-semibold text-orange-600">
                          {formatRupiah(lineTotal)}
                        </p>
                        <p className="text-[11px] text-green-600">
                          -{formatRupiah(lineDiscount)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold">
                        {formatRupiah(lineTotal)}
                      </p>
                    )}
                  </div>
                </div>
              )})}

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
            <div className="flex flex-col gap-4 border-t px-4 py-4 bg-muted/5">
              {showShippingSummary && order.shippingAssignment && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-2 sm:border-r sm:border-primary/20 sm:pr-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-primary">Jadwal Pengiriman</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span className="font-medium text-foreground">{formatDateOnly(order.shippingAssignment.deliveryDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium text-foreground">
                        {getShippingShiftLabel({
                          name: order.shippingAssignment.shiftName,
                          startTime: order.shippingAssignment.shiftStartTime,
                          endTime: order.shippingAssignment.shiftEndTime,
                          shiftLabel: order.shippingAssignment.shiftLabel,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserRound className="h-4 w-4" />
                      <span className="font-medium text-foreground">{order.shippingAssignment.driverName}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {footerActions}
                </div>
                <div className="text-right sm:ml-auto">
                  {totalItemDiscount > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Subtotal Awal: {formatRupiah(productSubtotalBeforeDiscount)}
                      </p>
                      <p className="text-xs text-green-600 mb-1">
                        Diskon: -{formatRupiah(totalItemDiscount)}
                      </p>
                    </>
                  ) : null}
                  <p className="text-xs text-muted-foreground mb-1">Total Pesanan</p>
                  <p className="text-lg font-bold text-primary">
                    {formatRupiah(order.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
