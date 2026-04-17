'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { formatRupiah } from '@/lib/utils';

interface CurrencyInputProps
  extends Omit<
    React.ComponentProps<typeof Input>,
    'type' | 'value' | 'defaultValue' | 'onChange'
  > {
  value?: number | null;
  onValueChange?: (value: number | null) => void;
}

function formatCurrencyValue(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }

  return formatRupiah(value);
}

function parseCurrencyValue(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  return Number(digits);
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, inputMode = 'numeric', ...props }, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode={inputMode}
        value={formatCurrencyValue(value)}
        onChange={(event) => {
          onValueChange?.(parseCurrencyValue(event.target.value));
        }}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
