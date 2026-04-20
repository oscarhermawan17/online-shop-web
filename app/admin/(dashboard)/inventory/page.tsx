'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

import { ErrorMessage, LoadingPage } from '@/components/shared';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminInventoryMovements, useAdminProducts } from '@/hooks';
import api from '@/lib/api';
import { downloadAdminReport } from '@/lib/report-download';
import { formatDate } from '@/lib/utils';
import type { StockMovementCategory } from '@/types';

const today = new Date().toISOString().slice(0, 10);
const firstDayOfCurrentMonth = (() => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
})();

const categoryOptions: Array<{ value: StockMovementCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Semua kategori' },
  { value: 'initial_stock', label: 'Stok awal' },
  { value: 'add_stock', label: 'Tambah stok' },
  { value: 'sale', label: 'Checkout / Penjualan' },
  { value: 'restore', label: 'Restore' },
];

export default function AdminInventoryPage() {
  const { products, isLoading: isLoadingProducts, isError: isProductsError } = useAdminProducts();
  const [startDate, setStartDate] = useState(firstDayOfCurrentMonth);
  const [endDate, setEndDate] = useState(today);
  const [productFilter, setProductFilter] = useState<string>('all');
  const [variantFilter, setVariantFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<StockMovementCategory | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [adjustProductId, setAdjustProductId] = useState<string>('all');
  const [adjustVariantId, setAdjustVariantId] = useState<string>('all');
  const [adjustDate, setAdjustDate] = useState(today);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const filters = useMemo(() => ({
    startDate,
    endDate,
    productId: productFilter,
    variantId: variantFilter,
    category: categoryFilter,
  }), [startDate, endDate, productFilter, variantFilter, categoryFilter]);

  const {
    movements,
    isLoading: isLoadingMovements,
    isError: isMovementsError,
    mutate: mutateMovements,
  } = useAdminInventoryMovements(filters);

  const productOptions = useMemo(() => {
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name?.trim() || 'Varian default',
        stock: variant.stock,
      })),
    }));
  }, [products]);

  const filteredVariants = useMemo(() => {
    if (productFilter === 'all') {
      return productOptions.flatMap((product) =>
        product.variants.map((variant) => ({
          productId: product.id,
          productName: product.name,
          id: variant.id,
          name: variant.name,
          stock: variant.stock,
        }))
      );
    }

    const selectedProduct = productOptions.find((product) => product.id === productFilter);
    if (!selectedProduct) {
      return [];
    }

    return selectedProduct.variants.map((variant) => ({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      id: variant.id,
      name: variant.name,
      stock: variant.stock,
    }));
  }, [productFilter, productOptions]);

  const adjustVariantOptions = useMemo(() => {
    if (adjustProductId === 'all') {
      return [];
    }

    const selectedProduct = productOptions.find((product) => product.id === adjustProductId);
    return selectedProduct?.variants ?? [];
  }, [adjustProductId, productOptions]);

  useEffect(() => {
    if (
      variantFilter !== 'all'
      && !filteredVariants.some((variant) => variant.id === variantFilter)
    ) {
      setVariantFilter('all');
    }
  }, [filteredVariants, variantFilter]);

  useEffect(() => {
    if (
      adjustVariantId !== 'all'
      && !adjustVariantOptions.some((variant) => variant.id === adjustVariantId)
    ) {
      setAdjustVariantId('all');
    }
  }, [adjustVariantId, adjustVariantOptions]);

  const totals = useMemo(() => {
    return movements.reduce((acc, movement) => {
      acc.rows += 1;
      acc.in += movement.inQty;
      acc.out += movement.outQty;
      return acc;
    }, { rows: 0, in: 0, out: 0 });
  }, [movements]);

  const currentAdjustVariant = useMemo(() => {
    return adjustVariantOptions.find((variant) => variant.id === adjustVariantId) ?? null;
  }, [adjustVariantId, adjustVariantOptions]);

  const handleClearFilter = () => {
    setStartDate(firstDayOfCurrentMonth);
    setEndDate(today);
    setProductFilter('all');
    setVariantFilter('all');
    setCategoryFilter('all');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (productFilter !== 'all') params.productId = productFilter;
      if (variantFilter !== 'all') params.variantId = variantFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      await downloadAdminReport(
        '/admin/inventory/export',
        params,
        `inventory-stock-history-${today}.xls`
      );
      toast.success('Laporan histori stok berhasil diunduh');
    } catch (error: unknown) {
      console.error('Export inventory history error:', error);
      toast.error('Gagal mengunduh laporan histori stok');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddStock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (adjustProductId === 'all' || adjustVariantId === 'all') {
      toast.error('Pilih produk dan varian terlebih dahulu');
      return;
    }
    if (!adjustDate) {
      toast.error('Tanggal penambahan wajib diisi');
      return;
    }

    const quantity = Number(adjustQty);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error('Jumlah stok harus angka bulat lebih dari 0');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await api.post('/admin/inventory/add', {
        variantId: adjustVariantId,
        addedAt: adjustDate,
        quantity,
        notes: adjustNotes.trim() || undefined,
      });
      toast.success('Penambahan stok berhasil disimpan');
      setAdjustQty('');
      setAdjustNotes('');
      await mutateMovements();
    } catch (error: unknown) {
      console.error('Add stock error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menambah stok');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  if (isLoadingProducts || isLoadingMovements) {
    return <LoadingPage />;
  }

  if (isProductsError || isMovementsError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Inventory"
        message="Tidak dapat memuat data histori dan master stok."
        onRetry={() => mutateMovements()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-bold">Stok / Inventory</h1>
          <p className="text-muted-foreground">
            Kelola tambah stok, histori mutasi, dan export laporan stok berdasarkan tanggal.
          </p>
        </div>
      </div>
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="history">Histori Stok</TabsTrigger>
          <TabsTrigger value="add-stock">Penambahan Stok</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Filter Histori</CardTitle>
                <CardDescription>
                  Filter data histori stok sebelum export atau audit mutasi.
                </CardDescription>
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Tanggal Mulai</p>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Tanggal Akhir</p>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Produk</p>
                  <Select value={productFilter} onValueChange={setProductFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua produk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua produk</SelectItem>
                      {productOptions.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Varian</p>
                  <Select value={variantFilter} onValueChange={setVariantFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua varian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua varian</SelectItem>
                      {filteredVariants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.productName} - {variant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Kategori</p>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) => setCategoryFilter(value as StockMovementCategory | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="ghost" onClick={handleClearFilter}>
                  Reset Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Jumlah Baris Histori</CardDescription>
                <CardTitle>{totals.rows}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total In</CardDescription>
                <CardTitle>{totals.in}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Out</CardDescription>
                <CardTitle>{totals.out}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histori Mutasi Stok</CardTitle>
              <CardDescription>
                Struktur tabel mengikuti format: Id Product, id_variant, stock_status, in, out, kategori, stock.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Id Product</TableHead>
                      <TableHead>id_variant</TableHead>
                      <TableHead>stock_status</TableHead>
                      <TableHead>in</TableHead>
                      <TableHead>out</TableHead>
                      <TableHead>kategori</TableHead>
                      <TableHead>stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                          Tidak ada data histori stok untuk filter saat ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell>{formatDate(movement.createdAt)}</TableCell>
                          <TableCell>
                            <p className="font-mono text-xs">{movement.productId}</p>
                            <p className="text-xs text-muted-foreground">{movement.productName}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-mono text-xs">{movement.variantId}</p>
                            <p className="text-xs text-muted-foreground">{movement.variantName || 'Varian default'}</p>
                          </TableCell>
                          <TableCell>{movement.stockStatusLabel}</TableCell>
                          <TableCell>{movement.inQty > 0 ? movement.inQty : '-'}</TableCell>
                          <TableCell>{movement.outQty > 0 ? movement.outQty : '-'}</TableCell>
                          <TableCell>{movement.categoryLabel}</TableCell>
                          <TableCell className="font-medium">{movement.stock}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Catatan: nilai `stock` menunjukkan saldo stok varian setelah mutasi pada baris tersebut.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Master Penambahan Stok</CardTitle>
              <CardDescription>
                Tambahkan stok varian melalui tab ini agar histori mutasi tersimpan rapi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAddStock}>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Produk</p>
                    <Select value={adjustProductId} onValueChange={setAdjustProductId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Pilih produk</SelectItem>
                        {productOptions.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Varian</p>
                    <Select
                      value={adjustVariantId}
                      onValueChange={setAdjustVariantId}
                      disabled={adjustProductId === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih varian" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Pilih varian</SelectItem>
                        {adjustVariantOptions.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id}>
                            {variant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Tanggal Penambahan</p>
                    <Input
                      type="date"
                      value={adjustDate}
                      onChange={(e) => setAdjustDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Jumlah Tambah</p>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      placeholder="0"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Catatan (opsional)</p>
                    <Input
                      placeholder="Mis: restock supplier"
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <p className="text-muted-foreground">
                    {currentAdjustVariant
                      ? `Stok saat ini: ${currentAdjustVariant.stock}`
                      : 'Pilih varian untuk melihat stok saat ini.'}
                  </p>
                  <Button type="submit" disabled={isSubmittingAdd}>
                    {isSubmittingAdd ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    Simpan Tambah Stok
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
