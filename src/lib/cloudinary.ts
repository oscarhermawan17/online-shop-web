const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload image');
  }

  return response.json();
}

// Helper to generate optimized image URL
export function getOptimizedImageUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  const { width = 800, quality = 80 } = options;

  // If not a Cloudinary URL, return as-is
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Transform URL for optimization
  // Original: https://res.cloudinary.com/xxx/image/upload/v123/folder/image.jpg
  // Optimized: https://res.cloudinary.com/xxx/image/upload/w_800,q_80,f_auto/v123/folder/image.jpg
  return url.replace(
    '/image/upload/',
    `/image/upload/w_${width},q_${quality},f_auto/`
  );
}

// Helper for thumbnail URL
export function getThumbnailUrl(url: string, size: number = 150): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  return url.replace(
    '/image/upload/',
    `/image/upload/w_${size},h_${size},c_fill,f_auto/`
  );
}
