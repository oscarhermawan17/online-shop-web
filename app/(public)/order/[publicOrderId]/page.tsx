'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Receipt, MapPin, User, Phone, Truck, Store, Clock, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  PaymentInfo,
  OrderStatusTracker,
  UploadPaymentProof,
} from '@/components/public';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { usePublicOrder } from '@/hooks';
import { formatRupiah, formatDate } from '@/lib/utils';

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

  const showPaymentUpload =
    order.status === 'pending_payment' && !order.paymentProof;
  const showPaymentInfo =
    order.status === 'pending_payment' || order.status === 'waiting_confirmation';

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

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
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
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.variantDescription && (
                        <p className="text-sm text-muted-foreground">
                          Varian: {item.variantDescription}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {formatRupiah(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">{formatRupiah(item.price * item.quantity)}</p>
                  </div>
                ))}

                <Separator />

                {/* Subtotal + Shipping + Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal Produk</span>
                    <span>{formatRupiah(order.totalAmount - (order.shippingCost || 0))}</span>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Info */}
          {showPaymentInfo && (
            <PaymentInfo
              publicOrderId={order.publicOrderId}
              totalAmount={order.totalAmount}
              expiresAt={order.expiresAt}
              bankName={order.store.bankName}
              bankAccountNumber={order.store.bankAccountNumber}
              bankAccountName={order.store.bankAccountName}
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
      </div>
    </div>
  );
}
