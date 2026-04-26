import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  minioClient,
  minioBucket,
  minioPublicUrl,
  ensureBucketReady,
  buildTempKey,
  getPublicUrl,
} from '@/lib/minio-server';

/**
 * POST /api/upload/presign
 *
 * Generates a presigned PUT URL so the browser can upload directly to MinIO.
 * The file lands in the temp folder until the form is submitted and confirmed.
 *
 * Body: { purpose: "products" | "customer" | "payment" | "carousel", tenantId?: string }
 * Returns: { presignedUrl, tempKey, previewUrl }
 *
 * tenantId resolution:
 * - CURRENT: reads from body (passed by client from NEXT_PUBLIC_STORE_ID)
 * - FUTURE: read Host header → call GET /api/store → get storeId for that domain
 *   See CLAUDE.md "tenantId resolution" section for migration steps
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { purpose?: string; tenantId?: string; filename?: string };

    const purpose = body.purpose ?? 'uploads';
    const tenantId = body.tenantId ?? process.env.NEXT_PUBLIC_STORE_ID ?? 'default';

    // Get file extension from original filename, fallback to .jpg
    const originalFilename = body.filename ?? 'image.jpg';
    const ext = originalFilename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const uniqueFilename = `${randomUUID()}.${ext}`;

    const tempKey = buildTempKey(tenantId, purpose, uniqueFilename);

    // Make sure bucket is ready (creates it + sets public policy if needed)
    await ensureBucketReady();

    // Generate presigned PUT URL — expires in 5 minutes
    const EXPIRY_SECONDS = 5 * 60;
    const internalPresignedUrl = await minioClient.presignedPutObject(
      minioBucket,
      tempKey,
      EXPIRY_SECONDS
    );

    // Replace internal Docker hostname with public URL so the browser can reach it
    // e.g. http://minio:9000 → http://localhost:9000
    const presignedUrl = internalPresignedUrl.replace(
      /^https?:\/\/[^/]+/,
      minioPublicUrl
    );

    const previewUrl = getPublicUrl(tempKey);

    return NextResponse.json({ presignedUrl, tempKey, previewUrl });
  } catch (error) {
    console.error('[upload/presign] error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
