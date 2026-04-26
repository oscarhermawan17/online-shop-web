import { NextResponse } from 'next/server';
import { getMinioClient, getMinioBucket } from '@/lib/minio-server';

const TEMP_PREFIX = 'temp/';
const MAX_AGE_HOURS = 2;

/**
 * GET /api/upload/cleanup
 *
 * Deletes all objects under temp/ that are older than MAX_AGE_HOURS.
 * Call this via a cron job every hour.
 *
 * Example cron (on VPS, runs every hour):
 *   0 * * * * curl -s http://localhost:3000/api/upload/cleanup
 *
 * Returns: { deleted: number, errors: number }
 */
export async function GET() {
  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

  let deleted = 0;
  let errors = 0;
  const toDelete: string[] = [];

  await new Promise<void>((resolve, reject) => {
    const stream = getMinioClient().listObjects(getMinioBucket(), TEMP_PREFIX, true);

    stream.on('data', (obj) => {
      if (obj.name && obj.lastModified && new Date(obj.lastModified) < cutoff) {
        toDelete.push(obj.name);
      }
    });

    stream.on('end', resolve);
    stream.on('error', reject);
  });

  for (const key of toDelete) {
    try {
      await getMinioClient().removeObject(getMinioBucket(), key);
      deleted++;
    } catch (err) {
      console.error(`[cleanup] Failed to delete ${key}:`, err);
      errors++;
    }
  }

  console.log(`[upload/cleanup] Deleted ${deleted} temp files, ${errors} errors`);
  return NextResponse.json({ deleted, errors, cutoff: cutoff.toISOString() });
}
