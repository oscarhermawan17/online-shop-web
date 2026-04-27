'use client';

import { type ChangeEvent, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, CheckCheck, Loader2, MessageSquareWarning, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getThumbnailUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { OrderComplaint } from '@/types';

interface OrderDeliveryActionsProps {
  orderId: string;
  orderStatus: string;
  adminCompletedAt?: string | null;
  customerCompletedAt?: string | null;
  complaints?: OrderComplaint[];
  onSuccess?: () => void | Promise<unknown>;
}

export function OrderDeliveryActions({
  orderId,
  orderStatus,
  adminCompletedAt,
  customerCompletedAt,
  complaints = [],
  onSuccess,
}: OrderDeliveryActionsProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintComment, setComplaintComment] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (orderStatus !== 'shipped') {
    return null;
  }

  const hasOpenComplaint = complaints.some((complaint) => (
    complaint.status === 'open' || complaint.status === 'accepted'
  ));
  const latestComplaint = complaints[0];

  const handleCompleteOrder = async () => {
    if (customerCompletedAt) {
      toast.info('Anda sudah menekan selesai untuk pesanan ini.');
      return;
    }
    if (hasOpenComplaint) {
      toast.error('Tidak bisa menyelesaikan pesanan saat komplain masih aktif.');
      return;
    }

    setIsCompleting(true);
    try {
      const response = await api.patch(`/customer/orders/${orderId}/complete`);
      const updatedStatus = response.data?.data?.status as string | undefined;
      await onSuccess?.();

      if (updatedStatus === 'done' || adminCompletedAt) {
        toast.success('Pesanan selesai. Admin dan pelanggan sudah konfirmasi.');
      } else {
        toast.success('Konfirmasi selesai diterima. Menunggu konfirmasi admin.');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menyelesaikan pesanan');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUploadEvidence = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) {
      return;
    }

    const nonImageFile = selectedFiles.find((file) => !file.type.startsWith('image/'));
    if (nonImageFile) {
      toast.error('Semua file bukti harus berupa gambar');
      return;
    }

    const oversizedFile = selectedFiles.find((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFile) {
      toast.error('Ukuran setiap file bukti maksimal 5MB');
      return;
    }

    setIsUploadingEvidence(true);
    try {
      const uploaded = await Promise.all(selectedFiles.map((file) => uploadToCloudinary(file)));
      setEvidenceUrls((prev) => [...prev, ...uploaded.map((item) => item.secure_url)]);
      toast.success(`${uploaded.length} bukti berhasil diunggah`);
    } catch (error) {
      console.error('Complaint evidence upload error:', error);
      toast.error('Gagal mengunggah bukti komplain');
    } finally {
      setIsUploadingEvidence(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const resetComplaintForm = () => {
    setComplaintComment('');
    setEvidenceUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitComplaint = async () => {
    if (complaintComment.trim().length === 0) {
      toast.error('Komentar komplain wajib diisi');
      return;
    }

    if (evidenceUrls.length === 0) {
      toast.error('Minimal satu bukti gambar wajib diunggah');
      return;
    }

    setIsSubmittingComplaint(true);
    try {
      await api.post(`/customer/orders/${orderId}/complaints`, {
        comment: complaintComment.trim(),
        evidenceImageUrls: evidenceUrls,
      });

      toast.success('Komplain berhasil dikirim');
      setIsComplaintOpen(false);
      resetComplaintForm();
      await onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal mengirim komplain');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const disableActions = isCompleting || isUploadingEvidence || isSubmittingComplaint;

  return (
    <>
      {latestComplaint && (
        <div className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p className="font-semibold">
            {latestComplaint.status === 'open'
              ? 'Komplain Anda sedang menunggu admin'
              : latestComplaint.status === 'accepted'
                ? 'Komplain Anda sedang diproses admin'
                : latestComplaint.status === 'resolved'
                  ? 'Komplain Anda sudah selesai'
                  : 'Komplain Anda ditolak admin'}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            {latestComplaint.comment}
          </p>
        </div>
      )}

      <Button
        type="button"
        size="sm"
        onClick={handleCompleteOrder}
        disabled={disableActions || Boolean(customerCompletedAt) || hasOpenComplaint}
      >
        {isCompleting ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <CheckCheck className="mr-1.5 h-4 w-4" />
        )}
        {customerCompletedAt ? 'Sudah Dikonfirmasi' : 'Selesaikan Pesanan'}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsComplaintOpen(true)}
        disabled={disableActions || hasOpenComplaint}
      >
        <MessageSquareWarning className="mr-1.5 h-4 w-4" />
        {hasOpenComplaint ? 'Komplain Diproses' : 'Ajukan Komplain'}
      </Button>

      <Dialog
        open={isComplaintOpen}
        onOpenChange={(open) => {
          setIsComplaintOpen(open);
          if (!open && !isSubmittingComplaint) {
            resetComplaintForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajukan Komplain Pesanan</DialogTitle>
            <DialogDescription>
              Jelaskan kendala pesanan dan lampirkan bukti gambar agar tim admin bisa menindaklanjuti.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`complaint-comment-${orderId}`}>Komentar Komplain *</Label>
              <Textarea
                id={`complaint-comment-${orderId}`}
                placeholder="Contoh: Produk yang diterima rusak pada bagian kemasan."
                value={complaintComment}
                onChange={(event) => setComplaintComment(event.target.value)}
                rows={4}
                disabled={isSubmittingComplaint}
              />
            </div>

            <div className="space-y-2">
              <Label>Bukti Gambar *</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {evidenceUrls.map((imageUrl, index) => (
                  <div
                    key={`${imageUrl}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-md border"
                  >
                    <Image
                      src={getThumbnailUrl(imageUrl, 240)}
                      alt={`Bukti komplain ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1.5 top-1.5 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleRemoveEvidence(index)}
                      disabled={isSubmittingComplaint}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <button
                  type="button"
                  className="flex aspect-square flex-col items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingEvidence || isSubmittingComplaint}
                >
                  {isUploadingEvidence ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span className="mt-1 text-xs">Tambah Bukti</span>
                    </>
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUploadEvidence}
                disabled={isUploadingEvidence || isSubmittingComplaint}
              />
              <p className="text-xs text-muted-foreground">
                Bisa upload lebih dari satu gambar. Format JPG/PNG/WEBP, maksimal 5MB per file.
              </p>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Pesanan baru berstatus selesai jika pelanggan dan admin sama-sama sudah menekan konfirmasi selesai.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsComplaintOpen(false)}
              disabled={isSubmittingComplaint}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmitComplaint}
              disabled={isSubmittingComplaint || isUploadingEvidence}
            >
              {isSubmittingComplaint ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquareWarning className="mr-1.5 h-4 w-4" />
              )}
              Kirim Komplain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
