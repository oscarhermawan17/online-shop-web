'use client';

import { useMemo, useState } from 'react';
import {
  Plus,
  Clock3,
  Loader2,
  Pencil,
  Trash2,
  CalendarRange,
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
import { ShippingShiftForm } from '@/components/admin/shipping-shift-form';
import { useAdminShippingShifts } from '@/hooks';
import { type ShippingShiftFormData } from '@/lib/validations';
import { formatTimeRange, getShippingShiftLabel } from '@/lib/utils';
import type { ShippingShift } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ShippingShiftsPage() {
  const { shifts, isLoading, isError, mutate } = useAdminShippingShifts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingShift, setEditingShift] = useState<ShippingShift | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedShifts = useMemo(
    () =>
      [...shifts].sort((a, b) => {
        const sortOrderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const sortOrderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;

        if (sortOrderA !== sortOrderB) {
          return sortOrderA - sortOrderB;
        }

        if (a.startTime !== b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }

        return a.name.localeCompare(b.name);
      }),
    [shifts],
  );

  const activeCount = sortedShifts.filter((shift) => shift.isActive).length;
  const inactiveCount = sortedShifts.length - activeCount;

  const openAddDialog = () => {
    setEditingShift(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (shift: ShippingShift) => {
    setEditingShift(shift);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingShift(null);
    }
  };

  const handleSubmit = async (data: ShippingShiftFormData) => {
    setIsSubmitting(true);

    try {
      if (editingShift) {
        await api.patch(`/admin/shipping-shifts/${editingShift.id}`, data);
        toast.success('Shift pengiriman berhasil diperbarui');
      } else {
        await api.post('/admin/shipping-shifts', data);
        toast.success('Shift pengiriman berhasil ditambahkan');
      }

      await mutate();
      handleDialogChange(false);
    } catch (error: unknown) {
      console.error('Save shipping shift error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || 'Gagal menyimpan shift pengiriman',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (shift: ShippingShift) => {
    if (!window.confirm(`Hapus shift "${shift.name}"?`)) {
      return;
    }

    setDeletingId(shift.id);

    try {
      await api.delete(`/admin/shipping-shifts/${shift.id}`);
      toast.success('Shift pengiriman berhasil dihapus');
      await mutate();
    } catch (error: unknown) {
      console.error('Delete shipping shift error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || 'Gagal menghapus shift pengiriman',
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
        title="Gagal Memuat Shift Pengiriman"
        message="Tidak dapat memuat data shift pengiriman"
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shift Pengiriman</h1>
          <p className="text-muted-foreground">
            Kelola jadwal pengiriman reusable untuk assignment order.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Shift
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Shift</CardDescription>
            <CardTitle className="text-2xl">{sortedShifts.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarRange className="h-4 w-4" />
            Semua template jadwal pengiriman
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Shift Aktif</CardDescription>
            <CardTitle className="text-2xl">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Muncul di dialog `Kirim` untuk order delivery
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Shift Nonaktif</CardDescription>
            <CardTitle className="text-2xl">{inactiveCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tetap tersimpan tetapi tidak bisa dipilih untuk assignment baru
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Shift</CardTitle>
          <CardDescription>
            Gunakan nama dan jam yang konsisten agar admin mudah memilih saat
            mengirim pesanan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedShifts.length === 0 ? (
            <EmptyState
              title="Belum Ada Shift Pengiriman"
              description="Tambahkan shift seperti Pagi, Siang, atau Sore agar admin bisa menjadwalkan pengiriman."
              actionLabel="Tambah Shift"
              onAction={openAddDialog}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedShifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="align-top">
                      <div>
                        <p className="font-medium">
                          {getShippingShiftLabel(shift)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Template untuk assignment pengiriman admin
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        {formatTimeRange(shift.startTime, shift.endTime)}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <span
                        className={
                          shift.isActive
                            ? 'inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700'
                            : 'inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
                        }
                      >
                        {shift.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(shift)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(shift)}
                          disabled={deletingId === shift.id}
                        >
                          {deletingId === shift.id ? (
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
              {editingShift ? 'Edit Shift Pengiriman' : 'Tambah Shift Pengiriman'}
            </DialogTitle>
            <DialogDescription>
              Shift ini akan dipakai admin saat menjadwalkan order delivery.
            </DialogDescription>
          </DialogHeader>
          <ShippingShiftForm
            shift={editingShift}
            isSubmitting={isSubmitting}
            onCancel={() => handleDialogChange(false)}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
