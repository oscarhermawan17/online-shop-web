'use client';

import { Check } from 'lucide-react';
import { cn, orderStatusLabels } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface OrderStatusProps {
  status: OrderStatus;
}

const statusSteps: OrderStatus[] = [
  'pending_payment',
  'waiting_confirmation',
  'paid',
  'shipped',
  'done',
];

export function OrderStatusTracker({ status }: OrderStatusProps) {
  const currentIndex = statusSteps.indexOf(status);
  const isExpiredOrCancelled = status === 'expired_unpaid' || status === 'cancelled';

  if (isExpiredOrCancelled) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-center">
        <p className="font-semibold text-destructive">
          {orderStatusLabels[status]}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === 'expired_unpaid'
            ? 'Pesanan kadaluarsa karena tidak ada pembayaran'
            : 'Pesanan telah dibatalkan'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {statusSteps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step} className="flex flex-1 items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium',
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/30 text-muted-foreground/50'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <p
                  className={cn(
                    'mt-2 text-center text-xs',
                    isCurrent
                      ? 'font-medium text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {orderStatusLabels[step]}
                </p>
              </div>

              {/* Connector Line */}
              {index < statusSteps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1',
                    index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple badge version for compact display
export function OrderStatusBadge({ status }: OrderStatusProps) {
  const colorClasses: Record<OrderStatus, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    waiting_confirmation: 'bg-blue-100 text-blue-800 border-blue-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    done: 'bg-gray-100 text-gray-800 border-gray-200',
    expired_unpaid: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorClasses[status]
      )}
    >
      {orderStatusLabels[status]}
    </span>
  );
}
