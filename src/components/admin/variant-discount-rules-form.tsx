'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import type {
  ProductVariant,
  VariantDiscountCustomerType,
  VariantDiscountRule,
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

interface VariantDiscountRulesFormProps {
  productId: string;
  variants: ProductVariant[];
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

const getSellableVariants = (variants: ProductVariant[]) => {
  const realVariants = variants.filter((variant) => !variant.isDefault);
  return realVariants.length > 0 ? realVariants : variants;
};

const getVariantLabel = (variant: ProductVariant, index: number) =>
  variant.name?.trim() || (variant.isDefault ? 'Varian Utama' : `Varian ${index + 1}`);

const getCustomerLabel = (customerType: VariantDiscountRule['customerType']) => {
  if (customerType === 'base') return 'Customer biasa';
  if (customerType === 'wholesale') return 'Customer ritel';
  return 'Semua customer';
};

const getTriggerLabel = (triggerType: VariantDiscountRule['triggerType']) =>
  triggerType === 'quantity' ? 'Qty item' : 'Subtotal item';

const getApplyModeLabel = (applyMode: VariantDiscountRule['applyMode']) =>
  applyMode === 'per_item' ? 'Diskon per item' : 'Diskon total line';

const getRuleValueLabel = (rule: VariantDiscountRule) =>
  rule.valueType === 'percentage' ? `${rule.value}%` : formatRupiah(rule.value);

const getThresholdLabel = (rule: VariantDiscountRule) => {
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

export function VariantDiscountRulesForm({
  productId,
  variants,
  onRulesChange,
}: VariantDiscountRulesFormProps) {
  const sellableVariants = useMemo(() => getSellableVariants(variants), [variants]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<VariantDiscountRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(defaultRuleForm);

  useEffect(() => {
    if (!sellableVariants.length) {
      setSelectedVariantId('');
      return;
    }

    const variantStillExists = sellableVariants.some((variant) => variant.id === selectedVariantId);
    if (!variantStillExists) {
      setSelectedVariantId(sellableVariants[0].id);
    }
  }, [sellableVariants, selectedVariantId]);

  const selectedVariant = sellableVariants.find((variant) => variant.id === selectedVariantId) ?? null;

  const rules = useMemo(() => {
    if (!selectedVariant?.discountRules) return [];

    return [...selectedVariant.discountRules].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.minThreshold !== b.minThreshold) return b.minThreshold - a.minThreshold;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [selectedVariant]);

  const setField = <K extends keyof RuleFormState>(key: K, value: RuleFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreateDialog = () => {
    if (!selectedVariant) return;
    setEditingRule(null);
    setForm(defaultRuleForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (rule: VariantDiscountRule) => {
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
    if (!selectedVariant) return;

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
          `/admin/products/${productId}/variants/${selectedVariant.id}/discount-rules/${editingRule.id}`,
          payload,
        );
        toast.success('Rule diskon varian berhasil diperbarui');
      } else {
        await api.post(
          `/admin/products/${productId}/variants/${selectedVariant.id}/discount-rules`,
          payload,
        );
        toast.success('Rule diskon varian berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      setEditingRule(null);
      setForm(defaultRuleForm);
      onRulesChange();
    } catch (error: unknown) {
      console.error('Save variant discount rule error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan rule diskon varian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (rule: VariantDiscountRule) => {
    if (!selectedVariant) return;
    if (!confirm(`Hapus rule diskon "${rule.name || 'Tanpa Nama'}"?`)) return;

    setDeletingRuleId(rule.id);
    try {
      await api.delete(
        `/admin/products/${productId}/variants/${selectedVariant.id}/discount-rules/${rule.id}`,
      );
      toast.success('Rule diskon varian berhasil dihapus');
      onRulesChange();
    } catch (error: unknown) {
      console.error('Delete variant discount rule error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menghapus rule diskon varian');
    } finally {
      setDeletingRuleId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">Diskon per Varian</CardTitle>
          <p className="text-sm text-muted-foreground">
            Atur diskon bertingkat berdasarkan qty atau subtotal item per varian.
          </p>
        </div>
        <Button size="sm" onClick={openCreateDialog} disabled={!selectedVariant}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Rule
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!sellableVariants.length ? (
          <p className="text-sm text-muted-foreground">
            Varian belum tersedia. Tambahkan varian terlebih dulu.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Pilih Varian</Label>
              <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih varian" />
                </SelectTrigger>
                <SelectContent>
                  {sellableVariants.map((variant, index) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {getVariantLabel(variant, index)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedVariant ? null : rules.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Belum ada rule diskon untuk varian ini.
              </p>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
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
          </>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Rule Diskon Varian' : 'Tambah Rule Diskon Varian'}
              </DialogTitle>
              <DialogDescription>
                Satu varian bisa punya beberapa rule. Rule aktif dengan prioritas tertinggi akan dipilih.
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
                  onClick={() => setIsDialogOpen(false)}
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
