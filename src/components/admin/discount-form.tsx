'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { ProductDiscount } from '@/types';

interface DiscountFormProps {
  productId: string;
  discount: ProductDiscount | null | undefined;
  onSuccess: () => void;
}

export function DiscountForm({ productId, discount, onSuccess }: DiscountFormProps) {
  const [normalDiscount, setNormalDiscount] = useState<string>(
    discount?.normalDiscount?.toString() ?? ''
  );
  const [normalDiscountActive, setNormalDiscountActive] = useState(
    discount?.normalDiscountActive ?? false
  );
  const [retailDiscount, setRetailDiscount] = useState<string>(
    discount?.retailDiscount?.toString() ?? ''
  );
  const [retailDiscountActive, setRetailDiscountActive] = useState(
    discount?.retailDiscountActive ?? false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    const normalPct = normalDiscount === '' ? null : Number(normalDiscount);
    const retailPct = retailDiscount === '' ? null : Number(retailDiscount);

    if (normalPct !== null && (normalPct < 1 || normalPct > 100)) {
      toast.error('Diskon Harga Normal harus antara 1–100');
      return;
    }
    if (retailPct !== null && (retailPct < 1 || retailPct > 100)) {
      toast.error('Diskon Harga Retail harus antara 1–100');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/admin/products/${productId}/discount`, {
        normalDiscount: normalPct,
        normalDiscountActive: normalPct ? normalDiscountActive : false,
        retailDiscount: retailPct,
        retailDiscountActive: retailPct ? retailDiscountActive : false,
      });
      toast.success('Diskon berhasil disimpan');
      onSuccess();
    } catch {
      toast.error('Gagal menyimpan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Diskon Produk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Normal Price Discount */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Diskon Harga Normal</Label>
              <p className="text-xs text-muted-foreground">Berlaku untuk guest (tidak login)</p>
            </div>
            <Switch
              checked={normalDiscountActive}
              onCheckedChange={setNormalDiscountActive}
              disabled={!normalDiscount}
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              placeholder="Contoh: 10"
              value={normalDiscount}
              onChange={(e) => {
                setNormalDiscount(e.target.value);
                if (!e.target.value) setNormalDiscountActive(false);
              }}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        {/* Retail Price Discount */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Diskon Harga Retail</Label>
              <p className="text-xs text-muted-foreground">Berlaku untuk customer ritel (login)</p>
            </div>
            <Switch
              checked={retailDiscountActive}
              onCheckedChange={setRetailDiscountActive}
              disabled={!retailDiscount}
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              placeholder="Contoh: 5"
              value={retailDiscount}
              onChange={(e) => {
                setRetailDiscount(e.target.value);
                if (!e.target.value) setRetailDiscountActive(false);
              }}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Diskon
        </Button>
      </CardContent>
    </Card>
  );
}
