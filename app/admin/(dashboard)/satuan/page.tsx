'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { useAdminUnits } from '@/hooks';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function SatuanPage() {
  const { units, isLoading, isError, mutate } = useAdminUnits();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/admin/units/${editingId}`, { name });
        toast.success('Satuan berhasil diperbarui');
      } else {
        await api.post('/admin/units', { name });
        toast.success('Satuan berhasil ditambahkan');
      }
      setName('');
      setEditingId(null);
      mutate();
    } catch (error: unknown) {
      console.error('Save unit error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan satuan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (unit: any) => {
    setEditingId(unit.id);
    setName(unit.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus satuan ini?')) return;

    try {
      await api.delete(`/admin/units/${id}`);
      toast.success('Satuan berhasil dihapus');
      mutate();
    } catch (error: unknown) {
      console.error('Delete unit error:', error);
      toast.error('Gagal menghapus satuan');
    }
  };

  if (isLoading) return <LoadingPage />;
  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Data"
        message="Tidak dapat memuat daftar satuan"
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Master Satuan</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Satuan' : 'Tambah Satuan'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Satuan *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Kg, Pcs, Dus"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting || !name.trim()}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {editingId ? 'Simpan' : 'Tambah'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Daftar Satuan</CardTitle>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada satuan.
              </div>
            ) : (
              <div className="space-y-2">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{unit.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(unit)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(unit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
