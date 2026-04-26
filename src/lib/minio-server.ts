/**
 * MinIO server-side client
 * ONLY import this in Next.js API routes (server-side) — never in client components
 */
import { Client } from 'minio';

function createMinioClient() {
  const endpoint = process.env.MINIO_ENDPOINT;
  const port = process.env.MINIO_PORT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  const useSSL = process.env.MINIO_USE_SSL === 'true';

  if (!endpoint || !port || !accessKey || !secretKey) {
    throw new Error('MinIO environment variables are not configured');
  }

  return new Client({
    endPoint: endpoint,
    port: parseInt(port),
    useSSL,
    accessKey,
    secretKey,
  });
}

export const minioClient = createMinioClient();
export const minioBucket = process.env.MINIO_BUCKET ?? 'uploads';

/**
 * Public base URL for serving images — e.g. http://localhost:9000 or http://43.129.52.166:9000
 * Used to build public image URLs and presigned upload URLs (browser-accessible)
 */
export const minioPublicUrl = process.env.MINIO_PUBLIC_URL ?? `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;

/**
 * Ensure the bucket exists and is publicly readable.
 * Call this once on startup or before first upload.
 */
export async function ensureBucketReady() {
  const exists = await minioClient.bucketExists(minioBucket);

  if (!exists) {
    await minioClient.makeBucket(minioBucket);
  }

  // Set bucket policy to allow public read (anonymous GET)
  const policy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${minioBucket}/*`],
      },
    ],
  });

  await minioClient.setBucketPolicy(minioBucket, policy);
}

/**
 * Get the public URL for a stored object
 */
export function getPublicUrl(objectKey: string): string {
  return `${minioPublicUrl}/${minioBucket}/${objectKey}`;
}

/**
 * Build object key for temp upload
 * Pattern: temp/{tenantId}/{purpose}/{filename}
 */
export function buildTempKey(tenantId: string, purpose: string, filename: string): string {
  return `temp/${tenantId}/${purpose}/${filename}`;
}

/**
 * Build object key for confirmed (permanent) upload
 * Pattern: {tenantId}/{purpose}/{filename}
 */
export function buildPermanentKey(tenantId: string, purpose: string, filename: string): string {
  return `${tenantId}/${purpose}/${filename}`;
}

/**
 * Extract filename from a temp key
 * e.g. "temp/abc/products/uuid.jpg" → "uuid.jpg"
 */
export function getFilenameFromKey(key: string): string {
  return key.split('/').pop() ?? key;
}

/**
 * Extract purpose from a temp key
 * e.g. "temp/abc/products/uuid.jpg" → "products"
 */
export function getPurposeFromKey(key: string): string {
  const parts = key.split('/');
  // parts: ["temp", tenantId, purpose, filename]
  return parts[2] ?? 'uploads';
}

/**
 * Extract tenantId from a temp key
 * e.g. "temp/abc-123/products/uuid.jpg" → "abc-123"
 */
export function getTenantIdFromKey(key: string): string {
  const parts = key.split('/');
  // parts: ["temp", tenantId, purpose, filename]
  return parts[1] ?? 'default';
}
