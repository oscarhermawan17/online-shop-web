'use client';

import { useRef, useState } from 'react';
import { Plus, Trash2, Loader2, Pencil, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { useAdminCategories } from '@/hooks';
import { toast } from 'sonner';
import api from '@/lib/api';
import { uploadFile, confirmUpload } from '@/lib/storage';

export default function CategoryPage() {
  const { categories, isLoading, isError, mutate } = useAdminCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/admin/categories/${editingId}`, { name, icon });
        toast.success('Kategori berhasil diperbarui');
      } else {
        await api.post('/admin/categories', { name, icon });
        toast.success('Kategori berhasil ditambahkan');
      }
      setName('');
      setIcon('');
      setEditingId(null);
      mutate();
    } catch (error: unknown) {
      console.error('Save category error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setName(category.name);
    setIcon(category.icon || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setIcon('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;

    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Kategori berhasil dihapus');
      mutate();
    } catch (error: unknown) {
      console.error('Delete category error:', error);
      toast.error('Gagal menghapus kategori');
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingIcon(true);
    try {
      const { tempKey } = await uploadFile(file, 'category');
      const { permanentUrl } = await confirmUpload(tempKey);
      setIcon(permanentUrl);
      toast.success('Icon kategori berhasil diunggah');
    } catch (error) {
      console.error('Upload category icon error:', error);
      toast.error('Gagal mengunggah icon kategori');
    } finally {
      setIsUploadingIcon(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) return <LoadingPage />;
  if (isError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Data"
        message="Tidak dapat memuat daftar kategori"
        onRetry={() => mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Master Kategori</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kategori *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Elektronik"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Opsional)</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="URL Icon atau nama class"
                  disabled={isSubmitting || isUploadingIcon}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting || isUploadingIcon}
                  >
                    {isUploadingIcon ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Icon
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Gunakan direct image URL atau upload agar stabil.
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleIconUpload}
                  disabled={isSubmitting || isUploadingIcon}
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
            <CardTitle>Daftar Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada kategori.
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.icon && (
                        <p className="text-xs text-muted-foreground">{category.icon}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(category.id)}
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
