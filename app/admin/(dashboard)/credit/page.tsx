'use client';

import { useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useAdminCredits } from '@/hooks';
import { LoadingPage, ErrorMessage, EmptyState } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { CustomerCreditListItem } from '@/types';

export default function AdminCreditPage() {
  const { credits, isLoading, isError, mutate } = useAdminCredits();
  const [limitDrafts, setLimitDrafts] = useState<Record<string, number | null>>({});
  const [topDrafts, setTopDrafts] = useState<Record<string, number | null>>({});
  const [savingLimitId, setSavingLimitId] = useState<string | null>(null);
  const [savingTopId, setSavingTopId] = useState<string | null>(null);

  const totals = useMemo(() => {
    return credits.reduce(
      (acc, item) => {
        acc.limit += item.creditLimit;
        acc.used += item.outstandingCredit;
        return acc;
      },
      { limit: 0, used: 0 },
    );
  }, [credits]);

  const getLimitInputValue = (item: CustomerCreditListItem): number | null => {
    if (limitDrafts[item.id] !== undefined) return limitDrafts[item.id];
    return item.creditLimit > 0 ? item.creditLimit : null;
  };

  const getTopInputValue = (item: CustomerCreditListItem): string => {
    if (topDrafts[item.id] !== undefined) {
      return topDrafts[item.id] !== null ? String(topDrafts[item.id]) : '';
    }
    return item.termOfPayment > 0 ? String(item.termOfPayment) : '';
  };

  const handleSaveLimit = async (item: CustomerCreditListItem) => {
    const creditLimit =
      limitDrafts[item.id] !== undefined ? (limitDrafts[item.id] ?? 0) : item.creditLimit;

    setSavingLimitId(item.id);
    try {
      await api.put(`/admin/credit/${item.id}`, {
        creditLimit,
        termOfPayment: item.termOfPayment,
      });
      toast.success(`Limit credit untuk ${item.name || item.phone} berhasil disimpan`);
      setLimitDrafts((prev) => { const next = { ...prev }; delete next[item.id]; return next; });
      mutate();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan limit credit');
    } finally {
      setSavingLimitId(null);
    }
  };

  const handleSaveTop = async (item: CustomerCreditListItem) => {
    const termOfPayment =
      topDrafts[item.id] !== undefined ? (topDrafts[item.id] ?? 0) : item.termOfPayment;

    setSavingTopId(item.id);
    try {
      await api.put(`/admin/credit/${item.id}`, {
        creditLimit: item.creditLimit,
        termOfPayment,
      });
      toast.success(`TOP untuk ${item.name || item.phone} berhasil disimpan`);
      setTopDrafts((prev) => { const next = { ...prev }; delete next[item.id]; return next; });
      mutate();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan TOP');
    } finally {
      setSavingTopId(null);
    }
  };

  if (isLoading) return <LoadingPage />;

  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Data Credit"
        message="Tidak dapat memuat pengaturan credit pelanggan"
        onRetry={() => mutate()}
      />
    );
  }

  if (credits.length === 0) {
    return (
      <EmptyState
        type="default"
        title="Belum Ada Pelanggan"
        description="Tambahkan pelanggan terlebih dahulu sebelum mengatur limit credit."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Limit Credit</h1>
        <p className="text-muted-foreground">
          Atur limit credit dan TOP pelanggan, pantau total invoice credit yang belum dilunasi.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pelanggan</CardDescription>
            <CardTitle>{credits.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Limit Credit</CardDescription>
            <CardTitle>{formatRupiah(totals.limit)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Credit Terpakai</CardDescription>
            <CardTitle>{formatRupiah(totals.used)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Credit Pelanggan</CardTitle>
          <CardDescription>
            TOP (Term of Payment) menentukan jatuh tempo tagihan dalam hari sejak tanggal pembelian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Limit Credit</TableHead>
                <TableHead>TOP (Hari)</TableHead>
                <TableHead>Terpakai</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Atur Limit</TableHead>
                <TableHead>Atur TOP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((item) => {
                const isSavingLimit = savingLimitId === item.id;
                const isSavingTop = savingTopId === item.id;

                const effectiveLimit =
                  limitDrafts[item.id] !== undefined ? (limitDrafts[item.id] ?? 0) : item.creditLimit;
                const effectiveTop =
                  topDrafts[item.id] !== undefined ? (topDrafts[item.id] ?? 0) : item.termOfPayment;

                const limitChanged = effectiveLimit !== item.creditLimit;
                const topChanged = effectiveTop !== item.termOfPayment;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <p className="font-medium">{item.name || '-'}</p>
                        <p className="text-sm text-muted-foreground">{item.phone}</p>
                        <p className="text-xs text-muted-foreground">{item.email || 'Tanpa email'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-2">
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        <Badge variant={item.hasAccount ? 'outline' : 'secondary'}>
                          {item.hasAccount ? 'Login aktif' : 'Belum login'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="align-top font-medium">
                      {formatRupiah(item.creditLimit)}
                    </TableCell>
                    <TableCell className="align-top">
                      {item.termOfPayment > 0 ? (
                        <Badge variant="outline">{item.termOfPayment} hari</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {formatRupiah(item.outstandingCredit)}
                    </TableCell>
                    <TableCell className="align-top">
                      {formatRupiah(item.remainingCredit)}
                    </TableCell>

                    {/* Atur Limit */}
                    <TableCell className="align-top">
                      <div className="flex gap-2">
                        <CurrencyInput
                          inputMode="numeric"
                          placeholder="Rp 0"
                          value={getLimitInputValue(item)}
                          onValueChange={(value) =>
                            setLimitDrafts((prev) => ({ ...prev, [item.id]: value }))
                          }
                          disabled={isSavingLimit}
                          className="w-36"
                        />
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => handleSaveLimit(item)}
                          disabled={isSavingLimit || !limitChanged}
                        >
                          {isSavingLimit ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>

                    {/* Atur TOP */}
                    <TableCell className="align-top">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Hari"
                          value={getTopInputValue(item)}
                          onChange={(e) => {
                            const val = e.target.value === ''
                              ? null
                              : Math.max(0, parseInt(e.target.value, 10) || 0);
                            setTopDrafts((prev) => ({ ...prev, [item.id]: val }));
                          }}
                          disabled={isSavingTop}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => handleSaveTop(item)}
                          disabled={isSavingTop || !topChanged}
                        >
                          {isSavingTop ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
