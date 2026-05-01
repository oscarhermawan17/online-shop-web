/**
 * Client-side storage helpers — replaces cloudinary.ts
 * Used by browser components to upload images via MinIO presigned URLs.
 *
 * Flow:
 *   1. compressImage()  — shrink file in browser before upload
 *   2. uploadFile()     — upload compressed file to MinIO temp folder
 *   3. confirmUpload()  — move temp → permanent after form submit
 */

import imageCompression from 'browser-image-compression';

export type UploadPurpose = 'products' | 'customer' | 'payment' | 'complaint' | 'carousel' | 'category' | 'qris';

export interface UploadResult {
  tempKey: string;
  previewUrl: string;
}

export interface ConfirmResult {
  permanentUrl: string;
}

// ─── Compression config per purpose ──────────────────────────────────────────
// maxSizeMB  : target output file size in MB
// maxWidthOrHeight: resize if image is larger than this (keeps aspect ratio)
// Global fallbacks come from env vars — override per purpose here in code.

const globalMaxSizeMB = parseFloat(process.env.NEXT_PUBLIC_IMG_MAX_SIZE_MB ?? '0.5');
const globalMaxPx = parseInt(process.env.NEXT_PUBLIC_IMG_MAX_WIDTH_PX ?? '1200');

const compressionConfig: Record<UploadPurpose, { maxSizeMB: number; maxWidthOrHeight: number }> = {
  products: { maxSizeMB: globalMaxSizeMB,  maxWidthOrHeight: globalMaxPx  }, // product gallery
  carousel: { maxSizeMB: 0.8,              maxWidthOrHeight: 1920         }, // banner — needs to look sharp
  payment:  { maxSizeMB: 0.3,              maxWidthOrHeight: 1000         }, // payment proof, just needs to be readable
  complaint: { maxSizeMB: 0.5,             maxWidthOrHeight: 1200         }, // complaint evidence
  customer: { maxSizeMB: 0.3,              maxWidthOrHeight: 800          }, // KTP etc
  category: { maxSizeMB: 0.1,              maxWidthOrHeight: 400          }, // small icon
  qris:     { maxSizeMB: 0.2,              maxWidthOrHeight: 800          }, // QR code — keep it sharp
};

// ─── Step 0: Compress ─────────────────────────────────────────────────────────

/**
 * Compresses an image in the browser before upload.
 * Uses purpose-specific settings from compressionConfig above.
 * Returns a new compressed File (same name, same type).
 */
async function compressImage(file: File, purpose: UploadPurpose): Promise<File> {
  const config = compressionConfig[purpose];

  const compressed = await imageCompression(file, {
    maxSizeMB: config.maxSizeMB,
    maxWidthOrHeight: config.maxWidthOrHeight,
    useWebWorker: true,       // non-blocking — runs in background thread
    fileType: file.type,      // keep original format (jpg stays jpg, png stays png)
  });

  // imageCompression returns a Blob — wrap it back into a File to keep the filename
  return new File([compressed], file.name, { type: compressed.type });
}

// ─── Step 1: Upload ───────────────────────────────────────────────────────────

/**
 * Compresses then uploads a file to MinIO temp folder.
 *
 * 1. Compress image in browser
 * 2. Request presigned PUT URL from /api/upload/presign
 * 3. PUT file directly to MinIO from browser
 * 4. Returns tempKey (used in confirmUpload) + previewUrl (for UI preview)
 */
export async function uploadFile(
  file: File,
  purpose: UploadPurpose
): Promise<UploadResult> {
  const tenantId = process.env.NEXT_PUBLIC_STORE_ID ?? 'default';

  // Compress before upload
  const compressedFile = await compressImage(file, purpose);

  // Get presigned URL from our Next.js API route
  const presignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose, tenantId, filename: compressedFile.name }),
  });

  if (!presignRes.ok) {
    throw new Error('Gagal mendapatkan URL upload');
  }

  const { presignedUrl, tempKey, previewUrl } = await presignRes.json() as {
    presignedUrl: string;
    tempKey: string;
    previewUrl: string;
  };

  // Upload compressed file directly to MinIO via presigned URL
  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    body: compressedFile,
    headers: { 'Content-Type': compressedFile.type || 'application/octet-stream' },
  });

  if (!uploadRes.ok) {
    throw new Error('Gagal mengunggah file ke storage');
  }

  return { tempKey, previewUrl };
}

// ─── Step 2: Confirm ──────────────────────────────────────────────────────────

/**
 * Moves a file from temp/ to its permanent folder after form submit.
 * Returns the permanent public URL to save in the database.
 *
 * Call this AFTER the user successfully submits the form.
 * The permanentUrl is what gets sent to the Express API.
 */
export async function confirmUpload(tempKey: string): Promise<ConfirmResult> {
  const res = await fetch('/api/upload/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempKey }),
  });

  if (!res.ok) {
    throw new Error('Gagal mengkonfirmasi upload');
  }

  return res.json() as Promise<ConfirmResult>;
}
