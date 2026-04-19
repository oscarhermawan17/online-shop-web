'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Eye, Edit, Trash2, MoreHorizontal, Loader2, ArrowUp, ArrowDown, ArrowUpDown, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRupiah, getThumbnailUrl, getPlaceholderImage } from '@/lib/utils';
import type { ProductListItem } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { downloadAdminReport } from '@/lib/report-download';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProductTableProps {
  products: ProductListItem[];
  onDelete: () => void;
}

type SortField = 'name' | 'category' | 'basePrice' | 'wholesalePrice' | 'variants' | 'stock' | 'status';
type SortDirection = 'asc' | 'desc';

const getSellableVariants = (product: ProductListItem) => {
  const realVariants = product.variants.filter((variant) => !variant.isDefault);
  return realVariants.length > 0 ? realVariants : product.variants;
};

const getTotalStock = (product: ProductListItem) => {
  const sellableVariants = getSellableVariants(product);
  return sellableVariants.length > 0
    ? sellableVariants.reduce((sum, variant) => sum + variant.stock, 0)
    : product.stock;
};

export function ProductTable({ products, onDelete }: ProductTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [normalPriceMinFilter, setNormalPriceMinFilter] = useState('');
  const [retailPriceMinFilter, setRetailPriceMinFilter] = useState('');
  const [variantMinFilter, setVariantMinFilter] = useState('');
  const [stockMinFilter, setStockMinFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const categoryOptions = useMemo(() => {
    const categoryMap = new Map<string, string>();
    products.forEach((product) => {
      product.categories.forEach((category) => {
        categoryMap.set(category.id, category.name);
      });
    });

    return Array.from(categoryMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const nameQuery = nameFilter.trim().toLowerCase();

    const normalPriceMin = Number(normalPriceMinFilter);
    const hasNormalPriceMin = normalPriceMinFilter !== '' && !Number.isNaN(normalPriceMin);

    const retailPriceMin = Number(retailPriceMinFilter);
    const hasRetailPriceMin = retailPriceMinFilter !== '' && !Number.isNaN(retailPriceMin);

    const variantMin = Number(variantMinFilter);
    const hasVariantMin = variantMinFilter !== '' && !Number.isNaN(variantMin);

    const stockMin = Number(stockMinFilter);
    const hasStockMin = stockMinFilter !== '' && !Number.isNaN(stockMin);

    return products.filter((product) => {
      if (nameQuery && !product.name.toLowerCase().includes(nameQuery)) {
        return false;
      }

      if (categoryFilter !== 'all') {
        const hasCategory = product.categories.some((category) => category.id === categoryFilter);
        if (!hasCategory) {
          return false;
        }
      }

      if (hasNormalPriceMin && product.basePrice < normalPriceMin) {
        return false;
      }

      if (hasRetailPriceMin) {
        if (!product.wholesalePrice || product.wholesalePrice < retailPriceMin) {
          return false;
        }
      }

      if (hasVariantMin && getSellableVariants(product).length < variantMin) {
        return false;
      }

      if (hasStockMin && getTotalStock(product) < stockMin) {
        return false;
      }

      if (statusFilter === 'active' && !product.isActive) {
        return false;
      }

      if (statusFilter === 'inactive' && product.isActive) {
        return false;
      }

      return true;
    });
  }, [
    products,
    nameFilter,
    categoryFilter,
    normalPriceMinFilter,
    retailPriceMinFilter,
    variantMinFilter,
    stockMinFilter,
    statusFilter,
  ]);

  const sortedProducts = useMemo(() => {
    const getSortValue = (product: ProductListItem) => {
      switch (sortField) {
        case 'name':
          return product.name.toLowerCase();
        case 'category':
          return product.categories
            .map((category) => category.name)
            .sort((a, b) => a.localeCompare(b))
            .join(', ')
            .toLowerCase();
        case 'basePrice':
          return product.basePrice;
        case 'wholesalePrice':
          return product.wholesalePrice ?? -1;
        case 'variants':
          return getSellableVariants(product).length;
        case 'stock':
          return getTotalStock(product);
        case 'status':
          return product.isActive ? 1 : 0;
        default:
          return '';
      }
    };

    return [...filteredProducts].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      let result = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        result = aValue - bValue;
      } else {
        result = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredProducts, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }

    if (sortDirection === 'asc') {
      return <ArrowUp className="h-3.5 w-3.5" />;
    }

    return <ArrowDown className="h-3.5 w-3.5" />;
  };

  const clearFilters = () => {
    setNameFilter('');
    setCategoryFilter('all');
    setNormalPriceMinFilter('');
    setRetailPriceMinFilter('');
    setVariantMinFilter('');
    setStockMinFilter('');
    setStatusFilter('all');
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Yakin ingin menghapus produk "${productName}"?`)) return;

    setDeletingId(productId);
    try {
      await api.delete(`/admin/products/${productId}`);
      toast.success('Produk berhasil dihapus');
      onDelete();
    } catch (error: unknown) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus produk');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params: Record<string, string> = {
        sortField,
        sortDirection,
      };

      const keyword = nameFilter.trim();
      if (keyword) {
        params.name = keyword;
      }
      if (categoryFilter !== 'all') {
        params.categoryId = categoryFilter;
      }
      if (normalPriceMinFilter !== '') {
        params.normalPriceMin = normalPriceMinFilter;
      }
      if (retailPriceMinFilter !== '') {
        params.retailPriceMin = retailPriceMinFilter;
      }
      if (variantMinFilter !== '') {
        params.variantMin = variantMinFilter;
      }
      if (stockMinFilter !== '') {
        params.stockMin = stockMinFilter;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      await downloadAdminReport(
        '/admin/products/export/inventory',
        params,
        `inventory-report-${new Date().toISOString().slice(0, 10)}.xls`,
      );
      toast.success('Laporan stok berhasil diunduh');
    } catch (error) {
      console.error('Export inventory report error:', error);
      toast.error('Gagal mengunduh laporan stok');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan {sortedProducts.length} dari {products.length} produk
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
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
      <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Gambar</TableHead>
            <TableHead>
              <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('name')}>
                Nama Produk
                <SortIcon field="name" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('category')}>
                Kategori
                <SortIcon field="category" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('basePrice')}>
                Harga Normal
                <SortIcon field="basePrice" />
              </Button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('wholesalePrice')}>
                Harga Retail
                <SortIcon field="wholesalePrice" />
              </Button>
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('variants')}>
                Varian
                <SortIcon field="variants" />
              </Button>
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('stock')}>
                Stok
                <SortIcon field="stock" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button variant="ghost" className="h-8 px-2" onClick={() => toggleSort('status')}>
                Status
                <SortIcon field="status" />
              </Button>
            </TableHead>
            <TableHead className="w-16">Aksi</TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="w-16">-</TableHead>
            <TableHead>
              <Input
                placeholder="Filter nama"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="h-8"
              />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Input
                type="number"
                min={0}
                placeholder="Min harga"
                value={normalPriceMinFilter}
                onChange={(e) => setNormalPriceMinFilter(e.target.value)}
                className="h-8"
              />
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <Input
                type="number"
                min={0}
                placeholder="Min retail"
                value={retailPriceMinFilter}
                onChange={(e) => setRetailPriceMinFilter(e.target.value)}
                className="h-8"
              />
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              <Input
                type="number"
                min={0}
                placeholder="Min varian"
                value={variantMinFilter}
                onChange={(e) => setVariantMinFilter(e.target.value)}
                className="h-8"
              />
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              <Input
                type="number"
                min={0}
                placeholder="Min stok"
                value={stockMinFilter}
                onChange={(e) => setStockMinFilter(e.target.value)}
                className="h-8"
              />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead className="w-16">
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearFilters}>
                Reset
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                Tidak ada produk yang cocok dengan filter.
              </TableCell>
            </TableRow>
          ) : sortedProducts.map((product) => {
            const imageUrl = product.images?.[0]?.imageUrl
              ? getThumbnailUrl(product.images[0].imageUrl, 80)
              : getPlaceholderImage(80, 80);

            const sellableVariants = getSellableVariants(product);
            const totalStock = getTotalStock(product);

            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded bg-muted">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium line-clamp-1">{product.name}</p>
                      {(() => {
                        const d = product.discount;
                        const hasNormal = d?.normalDiscountActive && d.normalDiscount;
                        const hasRetail = d?.retailDiscountActive && d.retailDiscount;
                        if (!hasNormal && !hasRetail) return null;

                        const lines: string[] = [];
                        if (hasNormal) lines.push(`Diskon ${d!.normalDiscount}% untuk Harga Normal`);
                        if (hasRetail) lines.push(`Diskon ${d!.retailDiscount}% untuk Harga Retail`);

                        return (
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="destructive" className="text-xs cursor-default shrink-0">
                                  DISKON
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs space-y-1">
                                {lines.map((line, i) => <p key={i}>{line}</p>)}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-muted-foreground md:hidden">
                      {formatRupiah(product.basePrice)}
                      {product.wholesalePrice && (
                        <span className="ml-1 text-xs">
                          / {formatRupiah(product.wholesalePrice)}
                        </span>
                      )}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {product.categories && product.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {product.categories.map((c) => (
                        <Badge key={c.id} variant="outline" className="text-xs font-normal">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatRupiah(product.basePrice)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {product.wholesalePrice
                    ? formatRupiah(product.wholesalePrice)
                    : <span className="text-muted-foreground">—</span>
                  }
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {sellableVariants.length > 0 ? (
                    <Badge variant="secondary">
                      {sellableVariants.length} varian
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={totalStock > 0 ? 'outline' : 'destructive'}>
                    {totalStock}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={product.isActive ? 'default' : 'secondary'}>
                    {product.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/product/${product.id}`} target="_blank">
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${product.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}
