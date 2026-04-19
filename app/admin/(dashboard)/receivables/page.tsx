'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Download, Loader2, PlusCircle } from 'lucide-react';

import api from '@/lib/api';
import { downloadAdminReport } from '@/lib/report-download';
import { useAdminReceivables } from '@/hooks';
import { formatDate, formatDateOnly, formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';
import type { ReceivableInvoiceItem } from '@/types';
import { LoadingPage, ErrorMessage, EmptyState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const today = new Date().toISOString().slice(0, 10);

const formatPaymentAmountInput = (digits: string) => {
  if (!digits) {
    return '';
  }

  return formatRupiah(Number(digits));
};

export default function AdminReceivablesPage() {
  const { receivables, isLoading, isError, mutate } = useAdminReceivables();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, { amount: string; receivedAt: string }>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const totals = useMemo(() => {
    return receivables.reduce((acc, item) => {
      acc.invoice += 1;
      acc.total += item.totalAmount;
      acc.paid += item.paidAmount;
      acc.remaining += item.remainingAmount;
      return acc;
    }, { invoice: 0, total: 0, paid: 0, remaining: 0 });
  }, [receivables]);

  const toggleExpand = (orderId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const getDraft = (invoice: ReceivableInvoiceItem) => {
    return paymentDrafts[invoice.id] || {
      amount: invoice.remainingAmount > 0 ? String(invoice.remainingAmount) : '',
      receivedAt: today,
    };
  };

  const updateDraft = (
    orderId: string,
    patch: Partial<{ amount: string; receivedAt: string }>,
  ) => {
    setPaymentDrafts((prev) => ({
      ...prev,
      [orderId]: {
        amount: prev[orderId]?.amount ?? '',
        receivedAt: prev[orderId]?.receivedAt ?? today,
        ...patch,
      },
    }));
  };

  const handleSubmitPayment = async (invoice: ReceivableInvoiceItem) => {
    const draft = getDraft(invoice);
    const amount = Number(draft.amount);

    setSubmittingId(invoice.id);
    try {
      await api.post(`/admin/receivables/${invoice.id}/payments`, {
        amount,
        receivedAt: draft.receivedAt,
      });
      toast.success(`Pembayaran untuk invoice ${invoice.publicOrderId} berhasil disimpan`);
      setPaymentDrafts((prev) => ({
        ...prev,
        [invoice.id]: {
          amount: '',
          receivedAt: today,
        },
      }));
      mutate();
    } catch (error: unknown) {
      console.error('Receivable payment error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan pembayaran piutang');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadAdminReport(
        '/admin/receivables/export',
        {},
        `receivables-report-${today}.xls`,
      );
      toast.success('Laporan piutang berhasil diunduh');
    } catch (error) {
      console.error('Export receivables report error:', error);
      toast.error('Gagal mengunduh laporan piutang');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Piutang"
        message="Tidak dapat memuat daftar invoice kredit"
        onRetry={() => mutate()}
      />
    );
  }

  if (receivables.length === 0) {
    return (
      <EmptyState
        type="orders"
        title="Belum Ada Piutang"
        description="Invoice kredit akan muncul di sini setelah ada transaksi credit."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Piutang</h1>
          <p className="text-muted-foreground">
            Pantau invoice kredit, sisa tagihan, dan catat pembayaran cicilan per invoice.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export XLS
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invoice</CardDescription>
            <CardTitle>{totals.invoice}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nilai Invoice</CardDescription>
            <CardTitle>{formatRupiah(totals.total)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sudah Dibayar</CardDescription>
            <CardTitle>{formatRupiah(totals.paid)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sisa Piutang</CardDescription>
            <CardTitle>{formatRupiah(totals.remaining)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Invoice Kredit</CardTitle>
          <CardDescription>
            Setiap baris adalah invoice induk. Expand untuk melihat cicilan dan input pembayaran baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Detail</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Dibayar</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivables.map((invoice) => {
                const isExpanded = !!expandedRows[invoice.id];
                const draft = getDraft(invoice);
                const isSubmitting = submittingId === invoice.id;

                return (
                  <Fragment key={invoice.id}>
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => toggleExpand(invoice.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono text-sm font-medium">{invoice.publicOrderId}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.customerName || '-'}</p>
                          <p className="text-sm text-muted-foreground">{invoice.customerPhone || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatRupiah(invoice.totalAmount)}</TableCell>
                      <TableCell>{formatRupiah(invoice.paidAmount)}</TableCell>
                      <TableCell className="font-medium">{formatRupiah(invoice.remainingAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.isSettled ? 'secondary' : 'default'}>
                          {invoice.isSettled ? 'Lunas' : 'Belum Lunas'}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${invoice.id}-details`}>
                        <TableCell colSpan={7} className="bg-muted/20">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-3 rounded-lg border bg-background p-4">
                              <div>
                                <p className="font-medium">Riwayat Pembayaran</p>
                                <p className="text-sm text-muted-foreground">
                                  Pembayaran dapat dicatat lebih dari satu kali untuk invoice yang sama.
                                </p>
                              </div>
                              {invoice.payments.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                  Belum ada pembayaran untuk invoice ini.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {invoice.payments.map((payment, index) => (
                                    <div
                                      key={payment.id}
                                      className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                      <div>
                                        <p className="text-sm font-medium">Pembayaran #{invoice.payments.length - index}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Tanggal diterima: {formatDateOnly(payment.receivedAt)}
                                        </p>
                                      </div>
                                      <p className="font-semibold">{formatRupiah(payment.amount)}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="space-y-3 rounded-lg border bg-background p-4">
                              <div>
                                <p className="font-medium">Input Pembayaran</p>
                                <p className="text-sm text-muted-foreground">
                                  Catat cicilan baru untuk invoice ini.
                                </p>
                              </div>

                              <div className="grid gap-3">
                                <div className="grid gap-1.5">
                                  <label className="text-sm font-medium">Nominal</label>
                                  <Input
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={formatPaymentAmountInput(draft.amount)}
                                    onChange={(e) => updateDraft(invoice.id, {
                                      amount: e.target.value.replace(/\D/g, ''),
                                    })}
                                    disabled={isSubmitting || invoice.isSettled}
                                  />
                                </div>
                                <div className="grid gap-1.5">
                                  <label className="text-sm font-medium">Tanggal Penerimaan</label>
                                  <Input
                                    type="date"
                                    value={draft.receivedAt}
                                    onChange={(e) => updateDraft(invoice.id, {
                                      receivedAt: e.target.value,
                                    })}
                                    disabled={isSubmitting || invoice.isSettled}
                                  />
                                </div>
                                <div className="rounded-lg bg-muted p-3 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sisa saat ini</span>
                                    <span className="font-medium">{formatRupiah(invoice.remainingAmount)}</span>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  onClick={() => handleSubmitPayment(invoice)}
                                  disabled={
                                    isSubmitting
                                    || invoice.isSettled
                                    || !draft.amount
                                    || !draft.receivedAt
                                  }
                                >
                                  {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Simpan Pembayaran
                                </Button>
                                {invoice.isSettled && (
                                  <p className="text-xs text-muted-foreground">
                                    Invoice ini sudah lunas, tidak bisa menerima pembayaran tambahan.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
