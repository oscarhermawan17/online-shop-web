'use client';

import Link from 'next/link';
import { Eye, Check, Truck, PackageCheck, MoreHorizontal, Loader2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrderStatusBadge } from '@/components/public/order-status';
import {
  formatRupiah,
  formatDate,
  formatDateOnly,
  getShippingShiftLabel,
} from '@/lib/utils';
import type { Order } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ShipOrderDialog } from './ship-order-dialog';

interface OrderTableProps {
  orders: Order[];
  onUpdate: () => void;
}

export function OrderTable({ orders, onUpdate }: OrderTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [shipOrder, setShipOrder] = useState<Order | null>(null);
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);

  const openShipDialog = (order: Order) => {
    setShipOrder(order);
    setIsShipDialogOpen(true);
  };

  const handleShipDialogChange = (open: boolean) => {
    setIsShipDialogOpen(open);
    if (!open) {
      setShipOrder(null);
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/confirm`);
      toast.success('Pembayaran berhasil dikonfirmasi');
      onUpdate();
    } catch (error: unknown) {
      console.error('Confirm error:', error);
      toast.error('Gagal mengkonfirmasi pembayaran');
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: 'shipped' | 'done') => {
    setLoadingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      toast.success(
        status === 'shipped'
          ? 'Pesanan ditandai sebagai dikirim'
          : 'Pesanan selesai'
      );
      onUpdate();
    } catch (error: unknown) {
      console.error('Update status error:', error);
      toast.error('Gagal mengubah status pesanan');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Pesanan</TableHead>
            <TableHead className="hidden sm:table-cell">Pelanggan</TableHead>
            <TableHead className="hidden md:table-cell">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
            <TableHead className="w-16">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <div>
                  <p className="font-mono text-sm font-medium">
                    {order.publicOrderId}
                  </p>
                  <p className="text-sm text-muted-foreground sm:hidden">
                    {order.customerName}
                  </p>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customerPhone}
                  </p>
                  {order.shippingAssignment && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateOnly(order.shippingAssignment.deliveryDate)} ·{' '}
                      {getShippingShiftLabel({
                        name: order.shippingAssignment.shiftName,
                        startTime: order.shippingAssignment.shiftStartTime,
                        endTime: order.shippingAssignment.shiftEndTime,
                        shiftLabel: order.shippingAssignment.shiftLabel,
                      })}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatRupiah(order.totalAmount)}
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatDate(order.createdAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={loadingId === order.id}
                    >
                      {loadingId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {order.status === 'waiting_confirmation' && (
                      <DropdownMenuItem
                        onClick={() => handleConfirmPayment(order.id)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Konfirmasi Bayar
                      </DropdownMenuItem>
                    )}
                    {order.status === 'paid' && (
                      order.deliveryMethod === 'delivery' ? (
                        <DropdownMenuItem onSelect={() => openShipDialog(order)}>
                          <Truck className="mr-2 h-4 w-4" />
                          Jadwalkan Pengiriman
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(order.id, 'shipped')}
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Tandai Dikirim
                        </DropdownMenuItem>
                      )
                    )}
                    {order.status === 'shipped' && (
                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(order.id, 'done')}
                      >
                        <PackageCheck className="mr-2 h-4 w-4" />
                        Selesaikan
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ShipOrderDialog
        order={shipOrder}
        open={isShipDialogOpen}
        onOpenChange={handleShipDialogChange}
        onSuccess={onUpdate}
      />
    </div>
  );
}
