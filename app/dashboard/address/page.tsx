'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Star,
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { fetcher, api } from '@/lib/api';
import type { CustomerAddress, CreateAddressPayload } from '@/types/address';

const AddressMap = dynamic(
  () => import('@/components/public/address-map'),
  { ssr: false },
);

const API_KEY = '/customer/addresses';

export default function AddressPage() {
  const { data: addresses, isLoading } = useSWR<CustomerAddress[]>(API_KEY, fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [deleting, setDeleting] = useState<CustomerAddress | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [label, setLabel] = useState('');
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setLabel('');
    setRecipient('');
    setPhone('');
    setAddress('');
    setDistrict(null);
    setLat(null);
    setLng(null);
    setIsDefault(false);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (addr: CustomerAddress) => {
    setEditing(addr);
    setLabel(addr.label);
    setRecipient(addr.recipient);
    setPhone(addr.phone);
    setAddress(addr.address);
    setDistrict(addr.district);
    setLat(addr.lat);
    setLng(addr.lng);
    setIsDefault(addr.isDefault);
    setDialogOpen(true);
  };

  const handleAddressFound = useCallback((addr: string) => {
    setAddress(addr);
  }, []);

  const handleDistrictDetected = useCallback((d: string | null) => {
    setDistrict(d);
  }, []);

  const handleSave = async () => {
    if (!label.trim() || !recipient.trim() || !phone.trim() || !address.trim()) {
      toast.error('Harap lengkapi label, penerima, telepon, dan alamat');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateAddressPayload = {
        label: label.trim(),
        recipient: recipient.trim(),
        phone: phone.trim(),
        address: address.trim(),
        district,
        lat,
        lng,
        isDefault,
      };

      if (editing) {
        await api.patch(`${API_KEY}/${editing.id}`, payload);
        toast.success('Alamat berhasil diperbarui');
      } else {
        await api.post(API_KEY, payload);
        toast.success('Alamat berhasil ditambahkan');
      }

      mutate(API_KEY);
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error('Gagal menyimpan alamat');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.delete(`${API_KEY}/${deleting.id}`);
      toast.success('Alamat berhasil dihapus');
      mutate(API_KEY);
      setDeleting(null);
    } catch {
      toast.error('Gagal menghapus alamat');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addr: CustomerAddress) => {
    try {
      await api.patch(`${API_KEY}/${addr.id}`, { isDefault: true });
      toast.success('Alamat utama berhasil diubah');
      mutate(API_KEY);
    } catch {
      toast.error('Gagal mengubah alamat utama');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold">Alamat Saya</h1>
        <div className="bg-white rounded-sm shadow-sm p-6 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Alamat Saya</h1>
        <Button
          onClick={openCreate}
          size="sm"
          className="bg-[#166534] hover:bg-[#14532d] text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Tambah Alamat
        </Button>
      </div>

      <div className="bg-white rounded-sm shadow-sm p-6">
        {!addresses || addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Belum ada alamat tersimpan</p>
            <p className="text-xs text-gray-400 mt-1">Tambahkan alamat pengiriman Anda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div key={addr.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{addr.label}</span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500">{addr.phone}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{addr.address}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium border-gray-300">
                        {addr.recipient}
                      </Badge>
                      {addr.district && (
                        <span className="text-[10px] text-gray-400">{addr.district}</span>
                      )}
                      {addr.isDefault && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-[#166534] hover:bg-[#166534] text-white">
                          Utama
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(addr)}
                      className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(addr)}
                      className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {!addr.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(addr)}
                        className="h-8 text-xs"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Utama
                      </Button>
                    )}
                  </div>
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Ubah Alamat' : 'Tambah Alamat Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Label Alamat</Label>
                <Input
                  placeholder="cth: Rumah, Kantor"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Nama Penerima</Label>
                <Input
                  placeholder="Nama lengkap penerima"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Nomor Telepon</Label>
              <Input
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Alamat Lengkap</Label>
              <Textarea
                placeholder="Masukkan alamat lengkap"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Pilih Lokasi di Peta</Label>
              <AddressMap
                address={address}
                onAddressFound={handleAddressFound}
                onDistrictDetected={handleDistrictDetected}
                showShippingZones={false}
              />
              {district && (
                <p className="text-xs text-gray-500">
                  Kecamatan terdeteksi: <span className="font-medium">{district}</span>
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-[#166534] focus:ring-[#166534] border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Jadikan alamat utama</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#166534] hover:bg-[#14532d] text-white"
            >
              {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Alamat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Alamat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin menghapus alamat <strong>{deleting?.label}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
