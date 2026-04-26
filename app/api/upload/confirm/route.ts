import { NextRequest, NextResponse } from 'next/server';
import {
  minioClient,
  minioBucket,
  buildPermanentKey,
  getPublicUrl,
  getFilenameFromKey,
  getPurposeFromKey,
  getTenantIdFromKey,
} from '@/lib/minio-server';

/**
 * POST /api/upload/confirm
 *
 * Moves a file from temp/ to its permanent folder after a form is submitted.
 * Deletes the temp file after copying.
 *
 * Body: { tempKey: "temp/{tenantId}/{purpose}/{filename}" }
 * Returns: { permanentUrl }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { tempKey?: string };
    const { tempKey } = body;

    if (!tempKey || !tempKey.startsWith('temp/')) {
      return NextResponse.json(
        { error: 'Invalid tempKey' },
        { status: 400 }
      );
    }

    const tenantId = getTenantIdFromKey(tempKey);
    const purpose = getPurposeFromKey(tempKey);
    const filename = getFilenameFromKey(tempKey);

    const permanentKey = buildPermanentKey(tenantId, purpose, filename);

    // Copy temp → permanent (MinIO has no native move, so copy + delete)
    await minioClient.copyObject(
      minioBucket,
      permanentKey,
      `/${minioBucket}/${tempKey}`
    );

    // Delete the temp file
    await minioClient.removeObject(minioBucket, tempKey);

    const permanentUrl = getPublicUrl(permanentKey);

    return NextResponse.json({ permanentUrl });
  } catch (error) {
    console.error('[upload/confirm] error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm upload' },
      { status: 500 }
    );
  }
}
