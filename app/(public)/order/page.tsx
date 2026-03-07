'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderLookupPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      router.push(`/order/${orderId.trim()}`);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Lacak Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="orderId" className="text-sm font-medium">
                Nomor Pesanan
              </label>
              <Input
                id="orderId"
                placeholder="Masukkan nomor pesanan"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={!orderId.trim()}>
              <Search className="h-4 w-4" />
              Cari Pesanan
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Nomor pesanan diberikan setelah Anda melakukan checkout
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
