import { S3Client } from '@aws-sdk/client-s3';

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'kravion-auto';
export const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  'https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev';
export const R2_ENDPOINT =
  process.env.R2_S3_ENDPOINT ||
  'https://d6e0e618a594c39ee7bf96cd59297564.r2.cloudflarestorage.com';

const accessKeyId =
  process.env.R2_ACCESS_KEY_ID || '1053aa24d7e128cff5da3170ec228598';
const secretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY ||
  '2d27a5f60d5c05a4fedea489f4f2f1d8d2d54fc8286878fddee7665cf7f7bece';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Generates the full public CDN URL for an R2 object key
 */
export function getR2PublicUrl(key: string): string {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  return `${R2_PUBLIC_URL}/${cleanKey}`;
}
