'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Receipt } from 'lucide-react';
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
                      {item.variantName && (
                        <p className="text-sm text-muted-foreground">
                          Varian: {item.variantName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {formatRupiah(item.unitPrice)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">{formatRupiah(item.subtotal)}</p>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5" />
                Informasi Pembeli
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Pesanan</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
              </div>
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
