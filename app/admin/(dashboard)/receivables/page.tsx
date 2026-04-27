'use client';

import { Fragment, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Loader2,
  PlusCircle,
} from 'lucide-react';

import api from '@/lib/api';
import { downloadAdminReport } from '@/lib/report-download';
import { useAdminReceivables } from '@/hooks';
import { formatDate, formatDateOnly, formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';
import type { ReceivableInvoiceItem, ReceivableOrderItem } from '@/types';
import { LoadingPage, ErrorMessage, EmptyState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const toDateInputValue = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = toDateInputValue(new Date());

const getDueDateLabel = (
  dueDate: string | null,
  remainingAmount: number,
): { label: string; color: string } | null => {
  if (!dueDate) return null;

  const todayMs = new Date();
  todayMs.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - todayMs.getTime()) / (1000 * 60 * 60 * 24));

  if (remainingAmount === 0) return { label: 'Lunas', color: 'text-green-600' };
  if (diffDays < 0) return { label: `Lewat ${Math.abs(diffDays)} hari`, color: 'text-red-600 font-semibold' };
  if (diffDays === 0) return { label: 'Jatuh tempo hari ini', color: 'text-orange-600 font-semibold' };
  if (diffDays <= 7) return { label: `${diffDays} hari lagi`, color: 'text-orange-500' };
  return { label: `${diffDays} hari lagi`, color: 'text-muted-foreground' };
};
const firstDayOfCurrentMonth = (() => {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
})();

type ReceivablesTab = 'unsettled' | 'settled';

const formatPaymentAmountInput = (digits: string) => {
  if (!digits) {
    return '';
  }

  return formatRupiah(Number(digits));
};

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const window = new Set([
    1,
    total,
    current,
    Math.max(2, current - 1),
    Math.min(total - 1, current + 1),
  ]);
  const sorted = Array.from(window).sort((a, b) => a - b);

  const result: (number | '...')[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    if (index > 0 && sorted[index] - sorted[index - 1] > 1) {
      result.push('...');
    }
    result.push(sorted[index]);
  }

  return result;
}

export default function AdminReceivablesPage() {
  const [activeTab, setActiveTab] = useState<ReceivablesTab>('unsettled');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [startDate, setStartDate] = useState(firstDayOfCurrentMonth);
  const [endDate, setEndDate] = useState(today);

  const { receivables, pagination, isLoading, isValidating, isError, mutate } = useAdminReceivables({
    page,
    limit,
    settled: activeTab,
    startDate,
    endDate,
  });

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, { amount: string; receivedAt: string }>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const totals = useMemo(() => {
    return receivables.reduce((acc, item) => {
      acc.total += item.totalAmount;
      acc.paid += item.paidAmount;
      acc.remaining += item.remainingAmount;
      return acc;
    }, { total: 0, paid: 0, remaining: 0 });
  }, [receivables]);

  const totalRows = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const startRow = totalRows === 0 ? 0 : (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, totalRows);
  const pageNumbers = getPageNumbers(page, totalPages);

  const resetExpandedRows = () => {
    setExpandedRows({});
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as ReceivablesTab);
    setPage(1);
    resetExpandedRows();
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (value && endDate && value > endDate) {
      setEndDate(value);
    }
    setPage(1);
    resetExpandedRows();
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (value && startDate && value < startDate) {
      setStartDate(value);
    }
    setPage(1);
    resetExpandedRows();
  };

  const handleLimitChange = (value: string) => {
    setLimit(Number(value));
    setPage(1);
    resetExpandedRows();
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }
    setPage(nextPage);
    resetExpandedRows();
  };

  const handleResetFilters = () => {
    setStartDate(firstDayOfCurrentMonth);
    setEndDate(today);
    setLimit(25);
    setPage(1);
    resetExpandedRows();
  };

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
      const params: Record<string, string> = {
        settled: activeTab,
      };

      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      await downloadAdminReport(
        '/admin/receivables/export',
        params,
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="unsettled">Belum Lunas</TabsTrigger>
          <TabsTrigger value="settled">Lunas</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>
            Default rentang tanggal adalah bulan berjalan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Tanggal Mulai</label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => handleStartDateChange(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => handleEndDateChange(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Baris per Halaman</label>
              <Select value={String(limit)} onValueChange={handleLimitChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResetFilters}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invoice (Filter)</CardDescription>
            <CardTitle>{totalRows}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nilai Invoice (Halaman Ini)</CardDescription>
            <CardTitle>{formatRupiah(totals.total)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sudah Dibayar (Halaman Ini)</CardDescription>
            <CardTitle>{formatRupiah(totals.paid)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sisa Piutang (Halaman Ini)</CardDescription>
            <CardTitle>{formatRupiah(totals.remaining)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Daftar Invoice Kredit {activeTab === 'settled' ? 'Lunas' : 'Belum Lunas'}
          </CardTitle>
          <CardDescription>
            Setiap baris adalah invoice induk. Expand untuk melihat cicilan dan input pembayaran baru.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isValidating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memperbarui data...
            </div>
          )}

          {receivables.length === 0 ? (
            <EmptyState
              type="orders"
              title={activeTab === 'settled' ? 'Belum Ada Piutang Lunas' : 'Belum Ada Piutang Belum Lunas'}
              description={
                activeTab === 'settled'
                  ? 'Invoice kredit lunas akan muncul di sini sesuai filter tanggal yang dipilih.'
                  : 'Invoice kredit yang belum lunas akan muncul di sini sesuai filter tanggal yang dipilih.'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Detail</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Dibayar</TableHead>
                  <TableHead>Sisa</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
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
                      <TableRow>
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
                          {invoice.dueDate ? (() => {
                            const info = getDueDateLabel(invoice.dueDate, invoice.remainingAmount);
                            return (
                              <div className="space-y-0.5">
                                <p className="text-sm whitespace-nowrap">{formatDateOnly(invoice.dueDate)}</p>
                                {info && (
                                  <p className={`text-xs whitespace-nowrap ${info.color}`}>{info.label}</p>
                                )}
                              </div>
                            );
                          })() : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoice.isSettled ? 'secondary' : 'default'}>
                            {invoice.isSettled ? 'Lunas' : 'Belum Lunas'}
                          </Badge>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow key={`${invoice.id}-details`}>
                          <TableCell colSpan={8} className="bg-muted/20">
                            <div className="grid gap-4 p-4 lg:grid-cols-3">
                              {/* Produk */}
                              <div className="space-y-3 rounded-lg border bg-background p-4">
                                <p className="font-medium text-sm">Produk yang Dibeli</p>
                                {invoice.items.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Tidak ada data produk.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {invoice.items.map((item: ReceivableOrderItem) => {
                                      const originalUnitPrice = item.originalPrice && item.originalPrice > item.price
                                        ? item.originalPrice : item.price;
                                      const lineDiscount = typeof item.discountAmount === 'number'
                                        ? item.discountAmount
                                        : Math.max(0, (originalUnitPrice - item.price) * item.quantity);
                                      const hasDiscount = lineDiscount > 0;

                                      return (
                                        <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{item.productName}</p>
                                            {item.variantDescription && (
                                              <p className="text-xs text-muted-foreground mt-0.5">
                                                Variasi: <span className="font-medium text-foreground">{item.variantDescription}</span>
                                              </p>
                                            )}
                                            {hasDiscount ? (
                                              <>
                                                <p className="text-xs text-muted-foreground mt-0.5 line-through">
                                                  {formatRupiah(originalUnitPrice)} × {item.quantity}
                                                </p>
                                                <p className="text-xs text-green-700 mt-0.5">
                                                  {formatRupiah(item.price)} × {item.quantity}
                                                </p>
                                                {item.discountRuleName && (
                                                  <p className="text-[11px] text-green-600 mt-0.5">
                                                    Diskon: {item.discountRuleName}
                                                  </p>
                                                )}
                                              </>
                                            ) : (
                                              <p className="text-xs text-muted-foreground mt-0.5">
                                                {formatRupiah(item.price)} × {item.quantity}
                                              </p>
                                            )}
                                          </div>
                                          <div className="text-right shrink-0">
                                            {hasDiscount && (
                                              <p className="text-xs text-muted-foreground line-through">
                                                {formatRupiah(originalUnitPrice * item.quantity)}
                                              </p>
                                            )}
                                            <p className="text-sm font-semibold">{formatRupiah(item.price * item.quantity)}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                            <div className="grid gap-4 lg:grid-cols-2 lg:col-span-2">
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
                                      onChange={(event) => updateDraft(invoice.id, {
                                        amount: event.target.value.replace(/\D/g, ''),
                                      })}
                                      disabled={isSubmitting || invoice.isSettled}
                                    />
                                  </div>
                                  <div className="grid gap-1.5">
                                    <label className="text-sm font-medium">Tanggal Penerimaan</label>
                                    <Input
                                      type="date"
                                      value={draft.receivedAt}
                                      onChange={(event) => updateDraft(invoice.id, {
                                        receivedAt: event.target.value,
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
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {pagination && totalRows > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {startRow}-{endRow} dari {totalRows} invoice
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || isValidating}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {pageNumbers.map((item, index) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
                        ...
                      </span>
                    );
                  }

                  return (
                    <Button
                      key={item}
                      variant={item === page ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(item)}
                      disabled={isValidating}
                    >
                      {item}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || isValidating}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
