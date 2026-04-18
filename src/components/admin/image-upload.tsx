'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from 'sonner';
import { getThumbnailUrl } from '@/lib/utils';

interface ImageItem {
  id?: string;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isNew?: boolean;
}

interface ImageUploadProps {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maksimal ${maxImages} gambar`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const result = await uploadToCloudinary(file);
        return {
          imageUrl: result.secure_url,
          altText: file.name,
          sortOrder: images.length + filesToUpload.indexOf(file),
          isNew: true,
        };
      });

      const newImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...newImages]);
      toast.success(`${newImages.length} gambar berhasil diunggah`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengunggah gambar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    if (disabled) return;

    const newImages = images.filter((_, i) => i !== index);
    // Update sort orders
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      sortOrder: i,
    }));
    onImagesChange(reorderedImages);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (disabled) return;

    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    [newImages[index], newImages[targetIndex]] = [
      newImages[targetIndex],
      newImages[index],
    ];

    // Update sort orders
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      sortOrder: i,
    }));
    onImagesChange(reorderedImages);
  };

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={image.id || `new-${index}`}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            <Image
              src={getThumbnailUrl(image.imageUrl, 200)}
              alt={image.altText || `Image ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:text-white"
                onClick={() => handleMoveImage(index, 'up')}
                disabled={disabled || index === 0}
              >
                <GripVertical className="h-4 w-4 rotate-90" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:text-red-400"
                onClick={() => handleRemoveImage(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {index === 0 && (
              <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                Utama
              </span>
            )}
          </div>
        ))}

        {/* Upload Button */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-muted/50"
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="mt-2 text-xs text-muted-foreground">
                  Tambah Gambar
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || disabled}
      />

      <p className="text-xs text-muted-foreground">
        {images.length}/{maxImages} gambar. Gambar pertama akan menjadi gambar
        utama.
      </p>
    </div>
  );
}
