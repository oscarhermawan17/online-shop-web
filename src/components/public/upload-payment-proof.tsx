'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from 'sonner';
import api from '@/lib/api';

interface UploadPaymentProofProps {
  publicOrderId: string;
  onSuccess: () => void;
  existingProof?: string | null;
}

export function UploadPaymentProof({
  publicOrderId,
  onSuccess,
  existingProof,
}: UploadPaymentProofProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingProof || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setIsUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file);

      // Send to API
      await api.post('/payment-proof', {
        publicOrderId,
        imageUrl: result.secure_url,
      });

      toast.success('Bukti pembayaran berhasil diunggah');
      onSuccess();
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error('Gagal mengunggah bukti pembayaran');
      setPreview(existingProof || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload Bukti Pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview ? (
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <Image
                src={preview}
                alt="Bukti pembayaran"
                fill
                className="object-contain"
              />
            </div>
            {!existingProof && !isUploading && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8"
                onClick={handleClearPreview}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Mengunggah...</p>
                </div>
              </div>
            )}
            {existingProof && (
              <div className="mt-2 flex items-center justify-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Bukti sudah diunggah</span>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary hover:bg-muted/50"
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              Klik untuk upload bukti pembayaran
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG atau GIF (max 5MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {!existingProof && !preview && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Pilih Gambar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
