'use client';

import { useMemo, useState } from 'react';
import { Edit2, Loader2, Plus, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import type {
  ProductDiscountRule,
  VariantDiscountCustomerType,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface ProductDiscountRulesFormProps {
  productId: string;
  rules: ProductDiscountRule[];
  onRulesChange: () => void;
}

type RuleFormState = {
  name: string;
  triggerType: 'quantity' | 'line_subtotal';
  minThreshold: number | null;
  maxThreshold: number | null;
  valueType: 'percentage' | 'fixed_amount';
  value: number | null;
  applyMode: 'per_item' | 'line_total';
  customerType: 'all' | VariantDiscountCustomerType;
  isActive: boolean;
  priority: number | null;
};

const defaultRuleForm: RuleFormState = {
  name: '',
  triggerType: 'quantity',
  minThreshold: 1,
  maxThreshold: null,
  valueType: 'percentage',
  value: null,
  applyMode: 'line_total',
  customerType: 'all',
  isActive: true,
  priority: 0,
};

const getCustomerLabel = (customerType: ProductDiscountRule['customerType']) => {
  if (customerType === 'base') return 'Customer biasa';
  if (customerType === 'wholesale') return 'Customer ritel';
  return 'Semua customer';
};

const getTriggerLabel = (triggerType: ProductDiscountRule['triggerType']) =>
  triggerType === 'quantity' ? 'Qty item' : 'Subtotal item';

const getApplyModeLabel = (applyMode: ProductDiscountRule['applyMode']) =>
  applyMode === 'per_item' ? 'Diskon per item' : 'Diskon total line';

const getRuleValueLabel = (rule: ProductDiscountRule) =>
  rule.valueType === 'percentage' ? `${rule.value}%` : formatRupiah(rule.value);

const getThresholdLabel = (rule: ProductDiscountRule) => {
  const min = rule.triggerType === 'quantity'
    ? `${rule.minThreshold}`
    : formatRupiah(rule.minThreshold);

  if (rule.maxThreshold === null) {
    return `>= ${min}`;
  }

  const max = rule.triggerType === 'quantity'
    ? `${rule.maxThreshold}`
    : formatRupiah(rule.maxThreshold);

  return `${min} - ${max}`;
};

const parseIntegerInput = (value: string): number | null => {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
};

const sortRules = (rules: ProductDiscountRule[]): ProductDiscountRule[] => (
  [...rules].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.minThreshold !== b.minThreshold) return b.minThreshold - a.minThreshold;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  })
);

export function ProductDiscountRulesForm({
  productId,
  rules,
  onRulesChange,
}: ProductDiscountRulesFormProps) {
  const sortedRules = useMemo(() => sortRules(rules), [rules]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<ProductDiscountRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(defaultRuleForm);

  const setField = <K extends keyof RuleFormState>(key: K, value: RuleFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setForm(defaultRuleForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (rule: ProductDiscountRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name ?? '',
      triggerType: rule.triggerType,
      minThreshold: rule.minThreshold,
      maxThreshold: rule.maxThreshold,
      valueType: rule.valueType,
      value: rule.value,
      applyMode: rule.applyMode,
      customerType: rule.customerType ?? 'all',
      isActive: rule.isActive,
      priority: rule.priority,
    });
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingRule(null);
      setForm(defaultRuleForm);
    }
  };

  const normalizeAndValidateForm = () => {
    if (form.minThreshold === null || form.minThreshold < 1) {
      throw new Error('Min threshold harus bilangan bulat >= 1');
    }
    const minThreshold = Math.floor(form.minThreshold);

    let maxThreshold: number | null = null;
    if (form.maxThreshold !== null) {
      const parsedMax = Math.floor(form.maxThreshold);
      if (parsedMax < 1) {
        throw new Error('Max threshold harus bilangan bulat >= 1');
      }
      if (parsedMax < minThreshold) {
        throw new Error('Max threshold harus >= Min threshold');
      }
      maxThreshold = parsedMax;
    }

    if (form.value === null || form.value <= 0) {
      throw new Error('Nilai diskon harus bilangan bulat > 0');
    }
    const value = Math.floor(form.value);
    if (form.valueType === 'percentage' && (value < 1 || value > 100)) {
      throw new Error('Persentase diskon harus di antara 1 sampai 100');
    }

    if (form.priority === null) {
      throw new Error('Prioritas harus bilangan bulat');
    }
    const priority = Math.floor(form.priority);

    return {
      name: form.name.trim() || null,
      triggerType: form.triggerType,
      minThreshold,
      maxThreshold,
      valueType: form.valueType,
      value,
      applyMode: form.applyMode,
      customerType: form.customerType === 'all' ? null : form.customerType,
      isActive: form.isActive,
      priority,
    };
  };

  const handleSaveRule = async () => {
    let payload: ReturnType<typeof normalizeAndValidateForm>;
    try {
      payload = normalizeAndValidateForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Form diskon tidak valid';
      toast.error(message);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRule) {
        await api.patch(
          `/admin/products/${productId}/discount-rules/${editingRule.id}`,
          payload,
        );
        toast.success('Rule diskon all varian berhasil diperbarui');
      } else {
        await api.post(
          `/admin/products/${productId}/discount-rules`,
          payload,
        );
        toast.success('Rule diskon all varian berhasil ditambahkan');
      }

      handleDialogOpenChange(false);
      onRulesChange();
    } catch (error: unknown) {
      console.error('Save product discount rule error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan rule diskon all varian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (rule: ProductDiscountRule) => {
    if (!confirm(`Hapus rule diskon "${rule.name || 'Tanpa Nama'}"?`)) return;

    setDeletingRuleId(rule.id);
    try {
      await api.delete(`/admin/products/${productId}/discount-rules/${rule.id}`);
      toast.success('Rule diskon all varian berhasil dihapus');
      onRulesChange();
    } catch (error: unknown) {
      console.error('Delete product discount rule error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menghapus rule diskon all varian');
    } finally {
      setDeletingRuleId(null);
    }
  };

  const handleToggleRule = async (rule: ProductDiscountRule) => {
    setTogglingRuleId(rule.id);
    try {
      await api.patch(`/admin/products/${productId}/discount-rules/${rule.id}`, {
        isActive: !rule.isActive,
      });
      toast.success(rule.isActive ? 'Rule diskon dinonaktifkan' : 'Rule diskon diaktifkan');
      onRulesChange();
    } catch (error: unknown) {
      console.error('Toggle product discount rule error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal mengubah status rule diskon all varian');
    } finally {
      setTogglingRuleId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="text-lg">Diskon All Varian</CardTitle>
          <p className="text-sm text-muted-foreground">
            Rule ini berlaku ke semua varian dalam produk.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Rule
          </Button>
        </div>

        {sortedRules.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Belum ada rule diskon all varian.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedRules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{rule.name || 'Rule tanpa nama'}</p>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getTriggerLabel(rule.triggerType)}: {getThresholdLabel(rule)}
                    {' • '}
                    Diskon: {getRuleValueLabel(rule)}
                    {' • '}
                    {getApplyModeLabel(rule.applyMode)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getCustomerLabel(rule.customerType)}
                    {' • '}
                    Prioritas: {rule.priority}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleRule(rule)}
                    disabled={togglingRuleId === rule.id}
                  >
                    {togglingRuleId === rule.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Power className="mr-2 h-4 w-4" />
                    )}
                    {rule.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(rule)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteRule(rule)}
                    disabled={deletingRuleId === rule.id}
                  >
                    {deletingRuleId === rule.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Rule Diskon All Varian' : 'Tambah Rule Diskon All Varian'}
              </DialogTitle>
              <DialogDescription>
                Rule ini berlaku untuk semua varian pada produk ini.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Nama Rule</Label>
                <Input
                  id="rule-name"
                  placeholder="Contoh: Diskon qty grosir"
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Trigger</Label>
                  <Select
                    value={form.triggerType}
                    onValueChange={(value: RuleFormState['triggerType']) => setField('triggerType', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quantity">Jumlah item (qty)</SelectItem>
                      <SelectItem value="line_subtotal">Subtotal item (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mode Diskon</Label>
                  <Select
                    value={form.applyMode}
                    onValueChange={(value: RuleFormState['applyMode']) => setField('applyMode', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line_total">Potong total item</SelectItem>
                      <SelectItem value="per_item">Potong setiap item</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rule-min-threshold">
                    {form.triggerType === 'quantity' ? 'Min Qty' : 'Min Subtotal (Rp)'}
                  </Label>
                  {form.triggerType === 'line_subtotal' ? (
                    <CurrencyInput
                      id="rule-min-threshold"
                      placeholder="Rp 0"
                      value={form.minThreshold}
                      onValueChange={(value) => setField('minThreshold', value)}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <Input
                      id="rule-min-threshold"
                      type="number"
                      min={1}
                      value={form.minThreshold ?? ''}
                      onChange={(event) => setField('minThreshold', parseIntegerInput(event.target.value))}
                      disabled={isSubmitting}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-max-threshold">
                    {form.triggerType === 'quantity' ? 'Max Qty (Opsional)' : 'Max Subtotal (Opsional)'}
                  </Label>
                  {form.triggerType === 'line_subtotal' ? (
                    <CurrencyInput
                      id="rule-max-threshold"
                      placeholder="Kosongkan tanpa batas atas"
                      value={form.maxThreshold}
                      onValueChange={(value) => setField('maxThreshold', value)}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <Input
                      id="rule-max-threshold"
                      type="number"
                      min={1}
                      placeholder="Kosongkan tanpa batas atas"
                      value={form.maxThreshold ?? ''}
                      onChange={(event) => setField('maxThreshold', parseIntegerInput(event.target.value))}
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Jenis Nilai Diskon</Label>
                  <Select
                    value={form.valueType}
                    onValueChange={(value: RuleFormState['valueType']) => setField('valueType', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Persentase (%)</SelectItem>
                      <SelectItem value="fixed_amount">Nominal (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-value">
                    {form.valueType === 'percentage' ? 'Nilai Diskon (%)' : 'Nilai Diskon (Rp)'}
                  </Label>
                  {form.valueType === 'fixed_amount' ? (
                    <CurrencyInput
                      id="rule-value"
                      placeholder="Rp 0"
                      value={form.value}
                      onValueChange={(value) => setField('value', value)}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <Input
                      id="rule-value"
                      type="number"
                      min={1}
                      max={100}
                      value={form.value ?? ''}
                      onChange={(event) => setField('value', parseIntegerInput(event.target.value))}
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Target Customer</Label>
                  <Select
                    value={form.customerType}
                    onValueChange={(value: RuleFormState['customerType']) => setField('customerType', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua customer</SelectItem>
                      <SelectItem value="base">Customer biasa</SelectItem>
                      <SelectItem value="wholesale">Customer ritel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-priority">Prioritas Rule</Label>
                  <Input
                    id="rule-priority"
                    type="number"
                    value={form.priority ?? ''}
                    onChange={(event) => setField('priority', parseIntegerInput(event.target.value))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Rule Aktif</p>
                  <p className="text-xs text-muted-foreground">
                    Rule nonaktif tidak akan dipakai saat checkout.
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(value) => setField('isActive', value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDialogOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleSaveRule}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingRule ? 'Simpan Perubahan' : 'Tambah Rule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
