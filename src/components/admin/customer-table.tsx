'use client';

import { MoreHorizontal, Loader2, UserCheck, UserX } from 'lucide-react';
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
import type { CustomerListItem } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CustomerTableProps {
  customers: CustomerListItem[];
  onStatusChange: () => void;
}

export function CustomerTable({ customers, onStatusChange }: CustomerTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleStatus = async (customer: CustomerListItem) => {
    const action = customer.isActive ? 'Nonaktifkan' : 'Aktifkan';
    if (!confirm(`Yakin ingin ${action.toLowerCase()} pelanggan "${customer.name || customer.phone}"?`)) return;

    setTogglingId(customer.id);
    try {
      await api.patch(`/admin/customers/${customer.id}/toggle-status`);
      toast.success(`Pelanggan berhasil di${customer.isActive ? 'nonaktifkan' : 'aktifkan'}`);
      onStatusChange();
    } catch (error: unknown) {
      console.error('Toggle status error:', error);
      toast.error('Gagal mengubah status pelanggan');
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>No. HP</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Tgl. Daftar</TableHead>
            <TableHead className="w-16">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <p className="font-medium">{customer.name || <span className="text-muted-foreground italic">—</span>}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm">{customer.phone}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <p className="text-sm text-muted-foreground">{customer.email || '—'}</p>
              </TableCell>
              <TableCell>
                <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                  {customer.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <p className="text-sm text-muted-foreground">{formatDate(customer.createdAt)}</p>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={togglingId === customer.id}
                    >
                      {togglingId === customer.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(customer)}
                      className={customer.isActive ? 'text-destructive focus:text-destructive' : ''}
                    >
                      {customer.isActive ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Nonaktifkan
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Aktifkan
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
