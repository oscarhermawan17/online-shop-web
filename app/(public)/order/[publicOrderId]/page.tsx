'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Receipt,
  MapPin,
  User,
  Phone,
  Truck,
  Store,
  Clock,
  StickyNote,
  CalendarDays,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  PaymentInfo,
  OrderStatusTracker,
  UploadPaymentProof,
  OrderDeliveryActions,
} from '@/components/public';
import { LoadingPage, ErrorMessage, OrderItemImage } from '@/components/shared';
import { usePublicOrder } from '@/hooks';
import {
  formatRupiah,
  formatDate,
  formatDateOnly,
  getShippingShiftLabel,
} from '@/lib/utils';

interface OrderPageProps {
  params: Promise<{ publicOrderId: string }>;
}

export default function OrderPage({ params }: OrderPageProps) {
  const { publicOrderId } = use(params);
  const { order, isLoading, isError, mutate } = usePublicOrder(publicOrderId);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          title="Pesanan Tidak Ditemukan"
          message="Nomor pesanan tidak valid atau pesanan tidak ditemukan."
          onRetry={() => mutate()}
        />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCreditOrder = order.paymentMethod === 'credit';
  const showPaymentUpload =
    !isCreditOrder && order.status === 'pending_payment' && !order.paymentProof;
  const showPaymentInfo =
    !isCreditOrder && (order.status === 'pending_payment' || order.status === 'waiting_confirmation');
  const showCreditInfo = isCreditOrder;
  const showDeliveryActions = order.status === 'shipped';
  const hasSidebar =
    showPaymentInfo
    || showPaymentUpload
    || order.status === 'waiting_confirmation'
    || showCreditInfo
    || showDeliveryActions;
  const productSubtotalAfterDiscount = Math.max(0, order.totalAmount - (order.shippingCost || 0));
  const totalProductDiscount = order.items.reduce((sum, item) => {
    const originalUnitPrice = item.originalPrice && item.originalPrice > item.price
      ? item.originalPrice
      : item.price;
    const computedLineDiscount = Math.max(0, (originalUnitPrice - item.price) * item.quantity);
    const lineDiscount = typeof item.discountAmount === 'number'
      ? item.discountAmount
      : computedLineDiscount;
    return sum + lineDiscount;
  }, 0);
  const productSubtotalBeforeDiscount = productSubtotalAfterDiscount + totalProductDiscount;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail Pesanan</h1>
          <p className="font-mono text-muted-foreground">{order.publicOrderId}</p>
        </div>
      </div>

      <div className={hasSidebar ? "grid gap-8 lg:grid-cols-3" : "max-w-3xl mx-auto"}>
        {/* Main Content */}
        <div className={`space-y-6 ${hasSidebar ? "lg:col-span-2" : ""}`}>
          {/* Status Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusTracker status={order.status} />
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Item Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => {
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
                    <div
                      key={item.id}
                      className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                        <OrderItemImage item={item} size={48} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.productName}</p>
                        {item.variantDescription && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Variasi: <span className="font-medium text-foreground">{item.variantDescription}</span>
                          </p>
                        )}
                        {hasDiscount ? (
                          <>
                            <p className="text-sm text-muted-foreground line-through mt-0.5">
                              {formatRupiah(originalUnitPrice)} x {item.quantity}
                            </p>
                            <p className="text-sm text-green-600">
                              {formatRupiah(item.price)} x {item.quantity}
                            </p>
                            <p className="text-xs text-green-600">
                              Diskon: -{formatRupiah(lineDiscount)}
                              {item.discountRuleName ? ` (${item.discountRuleName})` : ''}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {formatRupiah(item.price)} x {item.quantity}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {hasDiscount ? (
                          <>
                            <p className="text-sm text-muted-foreground line-through">
                              {formatRupiah(lineSubtotal)}
                            </p>
                            <p className="font-semibold">{formatRupiah(lineTotal)}</p>
                          </>
                        ) : (
                          <p className="font-semibold">{formatRupiah(lineTotal)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                <Separator />

                {/* Subtotal + Shipping + Total */}
                <div className="space-y-2">
                  {totalProductDiscount > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal Awal</span>
                        <span>{formatRupiah(productSubtotalBeforeDiscount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Diskon Produk</span>
                        <span className="font-medium text-green-600">
                          -{formatRupiah(totalProductDiscount)}
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal Produk</span>
                    <span>{formatRupiah(productSubtotalAfterDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ongkos Kirim</span>
                    <span>
                      {order.deliveryMethod === 'delivery' && order.shippingCost > 0
                        ? formatRupiah(order.shippingCost)
                        : order.deliveryMethod === 'pickup'
                          ? 'Gratis (Ambil di Toko)'
                          : 'Gratis'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatRupiah(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5" />
                Informasi Pembeli
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nama</p>
                    <p className="text-sm font-medium">{order.customerName || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telepon</p>
                    <p className="text-sm font-medium">{order.customerPhone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal Pesanan</p>
                    <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  {order.deliveryMethod === 'delivery'
                    ? <Truck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    : <Store className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  }
                  <div>
                    <p className="text-xs text-muted-foreground">Metode</p>
                    <p className="text-sm font-medium">
                      {order.deliveryMethod === 'delivery' ? 'Dikirim' : 'Ambil di Toko'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Receipt className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pembayaran</p>
                    <p className="text-sm font-medium">
                      {isCreditOrder ? 'Credit' : 'Transfer Bank'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              {order.customerAddress && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {order.deliveryMethod === 'delivery' ? 'Alamat Pengiriman' : 'Lokasi Toko'}
                      </p>
                      <p className="text-sm font-medium">{order.customerAddress}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Estimated delivery */}
              {order.deliveryMethod === 'delivery' && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Estimasi Tiba</p>
                      <p className="text-sm font-medium">
                        {(() => {
                          const created = new Date(order.createdAt);
                          const end = new Date(created.getTime() + 2 * 24 * 60 * 60 * 1000);
                          const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                          return `${fmt(created)} - ${fmt(end)}`;
                        })()}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {order.notes && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2.5">
                    <StickyNote className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Catatan</p>
                      <p className="text-sm font-medium">{order.notes}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {order.shippingAssignment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5" />
                  Informasi Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <Truck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Jadwal Pengiriman
                    </p>
                    <p className="text-sm font-medium">
                      {getShippingShiftLabel({
                        name: order.shippingAssignment.shiftName,
                        startTime: order.shippingAssignment.shiftStartTime,
                        endTime: order.shippingAssignment.shiftEndTime,
                        shiftLabel: order.shippingAssignment.shiftLabel,
                      })}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tanggal Kirim
                      </p>
                      <p className="text-sm font-medium">
                        {formatDateOnly(order.shippingAssignment.deliveryDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <UserRound className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Driver / Kurir
                      </p>
                      <p className="text-sm font-medium">
                        {order.shippingAssignment.driverName}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        {hasSidebar && (
          <div className="space-y-6">
            {showDeliveryActions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tindakan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <OrderDeliveryActions
                    orderId={order.publicOrderId}
                    orderStatus={order.status}
                    adminCompletedAt={order.adminCompletedAt}
                    customerCompletedAt={order.customerCompletedAt}
                    complaints={order.complaints}
                    completeUrl={`/order/${order.publicOrderId}/complete`}
                    showComplaintAction={false}
                    onSuccess={() => mutate()}
                  />
                </CardContent>
              </Card>
            )}

            {showCreditInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Credit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Transaksi ini menggunakan limit credit.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Invoice credit tetap tercatat sampai admin menandainya lunas.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status Invoice Credit</span>
                    <span className="font-medium">
                      {order.creditSettledAt ? 'Lunas' : 'Belum Lunas'}
                    </span>
                  </div>
                  {order.creditSettledAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tanggal Pelunasan</span>
                      <span className="font-medium">{formatDate(order.creditSettledAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            {showPaymentInfo && (
              <PaymentInfo
                publicOrderId={order.publicOrderId}
                totalAmount={order.totalAmount}
                expiresAt={order.expiresAt}
                bankAccounts={order.store.bankAccounts}
                qrisImageUrl={order.store.qrisImageUrl}
              />
            )}

            {/* Upload Payment Proof */}
            {showPaymentUpload && (
              <UploadPaymentProof
                publicOrderId={order.publicOrderId}
                onSuccess={() => mutate()}
                existingProof={order.paymentProof?.imageUrl}
              />
            )}

            {/* Waiting Confirmation Notice */}
            {order.status === 'waiting_confirmation' && (
              <Card>
                <CardContent className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Menunggu Konfirmasi</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Bukti pembayaran sudah diterima. Kami sedang memverifikasi pembayaran Anda.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
