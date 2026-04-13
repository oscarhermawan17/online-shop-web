'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Eye, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { useState } from 'react';
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

export function ProductTable({ products, onDelete }: ProductTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Gambar</TableHead>
            <TableHead>Nama Produk</TableHead>
            <TableHead className="hidden md:table-cell">Kategori</TableHead>
            <TableHead className="hidden md:table-cell">Harga Normal</TableHead>
            <TableHead className="hidden lg:table-cell">Harga Retail</TableHead>
            <TableHead className="hidden sm:table-cell">Varian</TableHead>
            <TableHead className="hidden sm:table-cell">Stok</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="w-16">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const imageUrl = product.images?.[0]?.imageUrl
              ? getThumbnailUrl(product.images[0].imageUrl, 80)
              : getPlaceholderImage(80, 80);

            const totalStock = product.variants.length > 0
              ? product.variants.reduce((sum, v) => sum + v.stock, 0)
              : product.stock;

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
                  {product.variants.length > 0 ? (
                    <Badge variant="secondary">
                      {product.variants.length} varian
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
  );
}
