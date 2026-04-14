'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Copy, Check, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatRupiah, getTimeRemaining, getOptimizedImageUrl } from '@/lib/utils';

interface PaymentInfoProps {
  publicOrderId: string;
  totalAmount: number;
  expiresAt: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  qrisImageUrl?: string | null;
}

export function PaymentInfo({
  publicOrderId,
  totalAmount,
  expiresAt,
  bankName,
  bankAccountNumber,
  bankAccountName,
  qrisImageUrl,
}: PaymentInfoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(
    expiresAt
      ? getTimeRemaining(expiresAt)
      : { expired: false, hours: 0, minutes: 0, seconds: 0, text: '-' }
  );

  useEffect(() => {
    if (!expiresAt) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining(expiresAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Berhasil disalin');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Gagal menyalin');
    }
  };

  const hasBankInfo = bankName && bankAccountNumber && bankAccountName;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Informasi Pembayaran</span>
          {timeRemaining.expired ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Kadaluarsa
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {timeRemaining.text}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order ID */}
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">Nomor Pesanan</p>
          <p className="mt-1 font-mono text-lg font-semibold">{publicOrderId}</p>
        </div>

        {/* Total Amount */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Pembayaran</p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {formatRupiah(totalAmount)}
          </p>
        </div>

        <Separator />

        {/* Bank Transfer */}
        {hasBankInfo && (
          <div className="space-y-4">
            <h4 className="font-semibold">Transfer Bank</h4>
            
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bank</p>
                  <p className="font-medium">{bankName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Rekening</p>
                  <p className="font-mono font-medium">{bankAccountNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(bankAccountNumber!, 'account')}
                >
                  {copiedField === 'account' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Atas Nama</p>
                  <p className="font-medium">{bankAccountName}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QRIS */}
        {qrisImageUrl && (
          <div className="space-y-4">
            <h4 className="font-semibold">QRIS</h4>
            <div className="flex justify-center">
              <div className="relative h-64 w-64 overflow-hidden rounded-lg bg-white p-2">
                <Image
                  src={getOptimizedImageUrl(qrisImageUrl, 256)}
                  alt="QRIS Code"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Scan QRIS menggunakan aplikasi e-wallet atau mobile banking
            </p>
          </div>
        )}

        {!hasBankInfo && !qrisImageUrl && (
          <div className="rounded-lg bg-yellow-50 p-4 text-center text-yellow-800">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
            <p className="font-medium">Informasi pembayaran belum tersedia</p>
            <p className="text-sm">Silakan hubungi penjual untuk detail pembayaran</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
