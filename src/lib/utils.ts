import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format to Indonesian Rupiah
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date to Indonesian locale
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

// Format date only (no time)
export function formatDateOnly(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(new Date(date));
}

// Get effective price (variant override or base price)
export function getEffectivePrice(
  basePrice: number,
  priceOverride?: number | null
): number {
  return priceOverride ?? basePrice;
}

// Calculate time remaining until expiry
export function getTimeRemaining(expiresAt: string): {
  expired: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  text: string;
} {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) {
    return { expired: true, hours: 0, minutes: 0, seconds: 0, text: 'Kadaluarsa' };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const text = `${hours}j ${minutes}m ${seconds}d`;

  return { expired: false, hours, minutes, seconds, text };
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate placeholder image URL
export function getPlaceholderImage(width: number = 400, height: number = 400): string {
  return `https://placehold.co/${width}x${height}/e2e8f0/64748b?text=No+Image`;
}

// Order status labels in Indonesian
export const orderStatusLabels: Record<string, string> = {
  pending_payment: 'Menunggu Pembayaran',
  waiting_confirmation: 'Menunggu Konfirmasi',
  paid: 'Sudah Dibayar',
  shipped: 'Dikirim',
  done: 'Selesai',
  expired_unpaid: 'Kadaluarsa',
  cancelled: 'Dibatalkan',
};

// Order status colors for badges
export const orderStatusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  waiting_confirmation: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-purple-100 text-purple-800',
  done: 'bg-gray-100 text-gray-800',
  expired_unpaid: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
};

// Cloudinary image optimization
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dunf5zurf';

export function getOptimizedImageUrl(
  url: string,
  width?: number,
  quality?: number
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url || getPlaceholderImage(width || 400, width || 400);
  }

  // Transform Cloudinary URL with optimizations
  const transformations = [
    'f_auto', // Auto format (webp, avif, etc.)
    'q_auto', // Auto quality
    width ? `w_${width}` : '',
    quality ? `q_${quality}` : '',
  ]
    .filter(Boolean)
    .join(',');

  // Insert transformations into Cloudinary URL
  return url.replace('/upload/', `/upload/${transformations}/`);
}

export function getThumbnailUrl(url: string, size: number = 200): string {
  return getOptimizedImageUrl(url, size);
}
