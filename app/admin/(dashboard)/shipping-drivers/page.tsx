'use client';

import { useMemo, useState } from 'react';
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  UserRoundCheck,
  UserRoundX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorMessage, LoadingPage } from '@/components/shared';
import { ShippingDriverForm } from '@/components/admin';
import { useAdminShippingDrivers } from '@/hooks';
import { type ShippingDriverFormData } from '@/lib/validations';
import type { ShippingDriver } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ShippingDriversPage() {
  const { drivers, isLoading, isError, mutate } = useAdminShippingDrivers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDriver, setEditingDriver] = useState<ShippingDriver | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedDrivers = useMemo(
    () => [...drivers].sort((a, b) => a.name.localeCompare(b.name)),
    [drivers],
  );

  const activeCount = sortedDrivers.filter((driver) => driver.isActive).length;
  const inactiveCount = sortedDrivers.length - activeCount;

  const openAddDialog = () => {
    setEditingDriver(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (driver: ShippingDriver) => {
    setEditingDriver(driver);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingDriver(null);
    }
  };

  const handleSubmit = async (data: ShippingDriverFormData) => {
    setIsSubmitting(true);

    try {
      if (editingDriver) {
        await api.patch(`/admin/shipping-drivers/${editingDriver.id}`, data);
        toast.success('Driver pengiriman berhasil diperbarui');
      } else {
        await api.post('/admin/shipping-drivers', data);
        toast.success('Driver pengiriman berhasil ditambahkan');
      }

      await mutate();
      handleDialogChange(false);
    } catch (error: unknown) {
      console.error('Save shipping driver error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || 'Gagal menyimpan driver pengiriman',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (driver: ShippingDriver) => {
    if (!window.confirm(`Hapus driver "${driver.name}"?`)) {
      return;
    }

    setDeletingId(driver.id);

    try {
      await api.delete(`/admin/shipping-drivers/${driver.id}`);
      toast.success('Driver pengiriman berhasil dihapus');
      await mutate();
    } catch (error: unknown) {
      console.error('Delete shipping driver error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || 'Gagal menghapus driver pengiriman',
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Driver Pengiriman"
        message="Tidak dapat memuat data driver pengiriman"
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Driver Pengiriman</h1>
          <p className="text-muted-foreground">
            Kelola daftar driver/kurir agar admin cukup memilih dari select saat
            mengirim pesanan.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Driver
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Driver</CardDescription>
            <CardTitle className="text-2xl">{sortedDrivers.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="h-4 w-4" />
            Semua driver/kurir yang terdaftar
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Driver Aktif</CardDescription>
            <CardTitle className="text-2xl">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRoundCheck className="h-4 w-4" />
            Muncul di select pengiriman
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Driver Nonaktif</CardDescription>
            <CardTitle className="text-2xl">{inactiveCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRoundX className="h-4 w-4" />
            Tersimpan, tetapi tidak bisa dipilih
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Driver / Kurir</CardTitle>
          <CardDescription>
            Aktifkan hanya driver yang siap dipilih pada assignment pengiriman.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedDrivers.length === 0 ? (
            <EmptyState
              title="Belum Ada Driver Pengiriman"
              description="Tambahkan driver/kurir agar admin bisa memilih dari daftar saat menjadwalkan pengiriman."
              actionLabel="Tambah Driver"
              onAction={openAddDialog}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Opsi select pengiriman admin
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          driver.isActive
                            ? 'inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700'
                            : 'inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
                        }
                      >
                        {driver.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(driver)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(driver)}
                          disabled={deletingId === driver.id}
                        >
                          {deletingId === driver.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? 'Edit Driver Pengiriman' : 'Tambah Driver Pengiriman'}
            </DialogTitle>
            <DialogDescription>
              Driver aktif akan muncul sebagai pilihan pada dialog kirim order.
            </DialogDescription>
          </DialogHeader>
          <ShippingDriverForm
            driver={editingDriver}
            isSubmitting={isSubmitting}
            onCancel={() => handleDialogChange(false)}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
