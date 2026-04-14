'use client';

import { useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useAdminCredits } from '@/hooks';
import { LoadingPage, ErrorMessage, EmptyState } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const getDraftValue = (item: CustomerCreditListItem) => {
    if (drafts[item.id] !== undefined) {
      return drafts[item.id];
    }

    return item.creditLimit > 0 ? String(item.creditLimit) : '';
  };

  const handleDraftChange = (customerId: string, value: string) => {
    const digits = value.replace(/\D/g, '');
    setDrafts((prev) => ({
      ...prev,
      [customerId]: digits,
    }));
  };

  const handleSave = async (item: CustomerCreditListItem) => {
    const rawValue = drafts[item.id] ?? String(item.creditLimit);
    const creditLimit = rawValue === '' ? 0 : Number(rawValue);

    setSavingId(item.id);
    try {
      await api.put(`/admin/credit/${item.id}`, { creditLimit });
      toast.success(`Limit credit untuk ${item.name || item.phone} berhasil disimpan`);
      setDrafts((prev) => ({
        ...prev,
        [item.id]: String(creditLimit),
      }));
      mutate();
    } catch (error: unknown) {
      console.error('Save credit error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan limit credit');
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

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
          Atur limit credit pelanggan dan pantau total invoice credit yang belum dilunasi.
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
            Satu pelanggan hanya memiliki satu data credit. Nilai terpakai dihitung dari total invoice credit yang belum dibayar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Limit Credit</TableHead>
                <TableHead>Terpakai</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead className="w-[220px]">Atur Limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((item) => {
                const draftValue = getDraftValue(item);
                const isSaving = savingId === item.id;
                const isChanged = Number(draftValue || 0) !== item.creditLimit;

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
                      {formatRupiah(item.outstandingCredit)}
                    </TableCell>
                    <TableCell className="align-top">
                      {formatRupiah(item.remainingCredit)}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex gap-2">
                        <Input
                          inputMode="numeric"
                          placeholder="0"
                          value={draftValue}
                          onChange={(e) => handleDraftChange(item.id, e.target.value)}
                          disabled={isSaving}
                        />
                        <Button
                          type="button"
                          onClick={() => handleSave(item)}
                          disabled={isSaving || !isChanged}
                        >
                          {isSaving ? (
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
