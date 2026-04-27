'use client';

import { Fragment, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { fetcher } from '@/lib/api';
import { formatRupiah, formatDateOnly, formatDate, orderStatusLabels, getOptimizedImageUrl, getPlaceholderImage } from '@/lib/utils';
import type { Order, OrderItem } from '@/types/order';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useSWR from 'swr';

interface CreditPaymentItem {
  id: string;
  amount: number;
  receivedAt: string;
}

interface CreditOrder extends Order {
  paidAmount: number;
  remainingAmount: number;
  termOfPayment: number;
  dueDate: string | null;
  creditPayments: CreditPaymentItem[];
}

type SortField = 'publicOrderId' | 'createdAt' | 'totalAmount' | 'paidAmount' | 'remainingAmount' | 'termOfPayment' | 'dueDate';
type SortDirection = 'asc' | 'desc';

const toDateInputValue = (value: Date): string => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getFirstDayOfCurrentMonth = (): string => {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
};

const getTodayDateInputValue = (): string => toDateInputValue(new Date());

function getDueDateLabel(
  dueDate: string | null,
  remainingAmount: number,
): { date: string; label: string; color: string } | null {
  if (!dueDate) return null;

  const todayMs = new Date();
  todayMs.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - todayMs.getTime()) / (1000 * 60 * 60 * 24));
  const date = formatDateOnly(dueDate);

  if (remainingAmount === 0) return { date, label: 'Lunas', color: 'text-green-600' };
  if (diffDays < 0) return { date, label: `Lewat ${Math.abs(diffDays)} hari`, color: 'text-red-600 font-semibold' };
  if (diffDays === 0) return { date, label: 'Jatuh tempo hari ini', color: 'text-orange-600 font-semibold' };
  if (diffDays <= 7) return { date, label: `${diffDays} hari lagi`, color: 'text-orange-500' };
  return { date, label: `${diffDays} hari lagi`, color: 'text-muted-foreground' };
}

function ExpandedDetail({ order }: { order: CreditOrder }) {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      {/* Produk */}
      <div className="space-y-3 rounded-lg border bg-white p-4">
        <p className="font-medium text-sm">Produk yang Dibeli</p>
        {order.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada data produk.</p>
        ) : (
          <div className="space-y-2">
            {order.items.map((item: OrderItem) => {
              const originalUnitPrice = item.originalPrice && item.originalPrice > item.price
                ? item.originalPrice : item.price;
              const lineDiscount = typeof item.discountAmount === 'number'
                ? item.discountAmount
                : Math.max(0, (originalUnitPrice - item.price) * item.quantity);
              const hasDiscount = lineDiscount > 0;
              const imgSrc = item.imageUrl
                ? getOptimizedImageUrl(item.imageUrl, 64)
                : getPlaceholderImage(64, 64);

              return (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                    <Image src={imgSrc} alt={item.productName} fill className="object-cover" />
                  </div>
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

        {/* Info pengiriman */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Status Pesanan</span>
            <span className="font-medium">{orderStatusLabels[order.status] ?? order.status}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Pengiriman</span>
            <span className="font-medium">{order.deliveryMethod === 'pickup' ? 'Ambil Sendiri' : 'Dikirim'}</span>
          </div>
          {order.shippingCost > 0 && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Ongkir</span>
              <span className="font-medium">{formatRupiah(order.shippingCost)}</span>
            </div>
          )}
          {order.notes && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Catatan</span>
              <span className="font-medium text-right">{order.notes}</span>
            </div>
          )}
          <div className="flex justify-between gap-2 border-t pt-1.5">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatRupiah(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Riwayat pembayaran kredit */}
      <div className="space-y-3 rounded-lg border bg-white p-4">
        <p className="font-medium text-sm">Riwayat Pembayaran Kredit</p>
        {order.creditPayments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Belum ada pembayaran tercatat untuk invoice ini.
          </div>
        ) : (
          <div className="space-y-2">
            {order.creditPayments.map((payment, index) => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Pembayaran #{order.creditPayments.length - index}</p>
                  <p className="text-xs text-muted-foreground">
                    Diterima: {formatDateOnly(payment.receivedAt)}
                  </p>
                </div>
                <p className="font-semibold text-green-700">{formatRupiah(payment.amount)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Ringkasan kredit */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Total Invoice</span>
            <span className="font-medium">{formatRupiah(order.totalAmount)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Sudah Dibayar</span>
            <span className="font-medium text-green-700">{formatRupiah(order.paidAmount)}</span>
          </div>
          <div className="flex justify-between gap-2 border-t pt-1.5">
            <span className="text-muted-foreground">Sisa Tagihan</span>
            <span className={`font-semibold ${order.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {order.remainingAmount > 0 ? formatRupiah(order.remainingAmount) : 'Lunas'}
            </span>
          </div>
          {order.dueDate && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Jatuh Tempo</span>
              <span className="font-medium">{formatDate(order.dueDate)}</span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Tanggal Order</span>
            <span className="font-medium">{formatDate(order.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditTable({ orders }: { orders: CreditOrder[] }) {
  const [invoiceFilter, setInvoiceFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-3.5 w-3.5" />;
    return <ArrowDown className="h-3.5 w-3.5" />;
  };

  const clearFilters = () => setInvoiceFilter('');

  const displayed = useMemo(() => {
    let result = [...orders];

    if (invoiceFilter.trim()) {
      const q = invoiceFilter.trim().toLowerCase();
      result = result.filter((o) => o.publicOrderId.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (sortField) {
        case 'publicOrderId':    va = a.publicOrderId;   vb = b.publicOrderId;   break;
        case 'createdAt':        va = a.createdAt;        vb = b.createdAt;        break;
        case 'totalAmount':      va = a.totalAmount;      vb = b.totalAmount;      break;
        case 'paidAmount':       va = a.paidAmount;       vb = b.paidAmount;       break;
        case 'remainingAmount':  va = a.remainingAmount;  vb = b.remainingAmount;  break;
        case 'termOfPayment':    va = a.termOfPayment;    vb = b.termOfPayment;    break;
        case 'dueDate':          va = a.dueDate ?? '';    vb = b.dueDate ?? '';    break;
        default:                 va = 0;                  vb = 0;
      }
      let res = 0;
      if (typeof va === 'number' && typeof vb === 'number') res = va - vb;
      else res = String(va).localeCompare(String(vb));
      return sortDirection === 'asc' ? res : -res;
    });

    return result;
  }, [orders, invoiceFilter, sortField, sortDirection]);

  if (orders.length === 0) {
    return (
      <EmptyState
        type="orders"
        title="Belum Ada Pembelian Kredit"
        description="Tidak ada pembelian kredit untuk filter saat ini."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Menampilkan {displayed.length} dari {orders.length} pesanan
      </p>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {/* Sort row */}
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('publicOrderId')}>
                  Invoice <SortIcon field="publicOrderId" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('createdAt')}>
                  Tgl Beli <SortIcon field="createdAt" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('totalAmount')}>
                  Total <SortIcon field="totalAmount" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('paidAmount')}>
                  Terbayar <SortIcon field="paidAmount" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('remainingAmount')}>
                  Sisa <SortIcon field="remainingAmount" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('termOfPayment')}>
                  TOP <SortIcon field="termOfPayment" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('dueDate')}>
                  Jatuh Tempo <SortIcon field="dueDate" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>

            {/* Filter row */}
            <TableRow>
              <TableHead />
              <TableHead>
                <Input
                  placeholder="Cari invoice"
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value)}
                  className="h-8"
                />
              </TableHead>
              <TableHead /><TableHead /><TableHead /><TableHead /><TableHead /><TableHead />
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearFilters}>
                  Reset
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  Tidak ada pesanan yang cocok dengan filter.
                </TableCell>
              </TableRow>
            ) : displayed.map((order) => {
              const dueLabel = getDueDateLabel(order.dueDate, order.remainingAmount);
              const isExpanded = !!expandedRows[order.id];

              return (
                <Fragment key={order.id}>
                  <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => toggleExpand(order.id)}>
                    <TableCell className="px-3 py-3">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 pointer-events-none">
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs">{order.publicOrderId}</TableCell>
                    <TableCell className="px-4 py-3 text-sm whitespace-nowrap">{formatDateOnly(order.createdAt)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm whitespace-nowrap">{formatRupiah(order.totalAmount)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-green-700">{formatRupiah(order.paidAmount)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm whitespace-nowrap">
                      {order.remainingAmount > 0
                        ? <span className="font-semibold text-red-600">{formatRupiah(order.remainingAmount)}</span>
                        : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {order.termOfPayment > 0 ? `${order.termOfPayment} hari` : '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {dueLabel ? (
                        <div className="space-y-0.5">
                          <p className="whitespace-nowrap text-muted-foreground">{dueLabel.date}</p>
                          <p className={`text-xs whitespace-nowrap ${dueLabel.color}`}>{dueLabel.label}</p>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {order.remainingAmount === 0 ? (
                        <Badge variant="secondary" className="text-green-700 bg-green-50">Lunas</Badge>
                      ) : (
                        <Badge variant="destructive">Belum Lunas</Badge>
                      )}
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow key={`${order.id}-detail`}>
                      <TableCell colSpan={9} className="p-0 bg-muted/20">
                        <ExpandedDetail order={order} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function CreditPage() {
  const [activeTab, setActiveTab] = useState('unpaid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: allOrders, isLoading } = useSWR<CreditOrder[]>(
    '/customer/credit/orders',
    fetcher,
  );

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (value && endDate && value > endDate) setEndDate(value);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (value && startDate && value < startDate) setStartDate(value);
  };

  const filtered = useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      if (startDate && createdAt < new Date(`${startDate}T00:00:00`)) return false;
      if (endDate) {
        const end = new Date(`${endDate}T00:00:00`);
        end.setDate(end.getDate() + 1);
        if (createdAt >= end) return false;
      }
      return true;
    });
  }, [allOrders, startDate, endDate]);

  const unpaidOrders = useMemo(() => filtered.filter((o) => o.remainingAmount > 0), [filtered]);
  const paidOrders   = useMemo(() => filtered.filter((o) => o.remainingAmount === 0), [filtered]);

  const totalRemaining = useMemo(
    () => unpaidOrders.reduce((sum, o) => sum + o.remainingAmount, 0),
    [unpaidOrders],
  );

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 pb-24 pt-4 md:px-0 md:pb-0 md:pt-0">
        <h1 className="text-lg font-semibold">Kredit Saya</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-24 pt-4 md:px-0 md:pb-0 md:pt-0">
      <div>
        <h1 className="text-lg font-semibold">Kredit Saya</h1>
        <p className="text-sm text-muted-foreground mt-1">Riwayat pembelian dengan metode kredit</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Tanggal</CardTitle>
          <CardDescription>
            Tanggal bisa dikosongkan untuk menampilkan semua pembelian kredit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setStartDate(getFirstDayOfCurrentMonth()); setEndDate(getTodayDateInputValue()); }}
            >
              Bulan Ini
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setStartDate(''); setEndDate(''); }}
            >
              Semua Tanggal
            </Button>
          </div>
        </CardContent>
      </Card>

      {unpaidOrders.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total sisa tagihan belum lunas</span>
              <Badge variant="destructive">{formatRupiah(totalRemaining)}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="pill" className="-mx-1 w-[calc(100%+0.5rem)] justify-start overflow-x-auto px-1">
          <TabsTrigger value="unpaid" className="min-w-fit">
            Belum Lunas
            {unpaidOrders.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                {unpaidOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="paid" className="min-w-fit">
            Lunas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid" className="mt-4">
          <CreditTable orders={unpaidOrders} />
        </TabsContent>
        <TabsContent value="paid" className="mt-4">
          <CreditTable orders={paidOrders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
