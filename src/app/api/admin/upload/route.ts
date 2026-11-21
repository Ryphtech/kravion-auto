import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET, getR2PublicUrl } from '@/lib/r2';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/gif',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/') && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type (${file.type}). File must be an image.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'File size exceeds maximum allowed limit of 10MB',
        },
        { status: 400 }
      );
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${Date.now()}-${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await r2Client.send(command);

    const url = getR2PublicUrl(key);

    return NextResponse.json({
      success: true,
      url,
      key,
    });
  } catch (error: any) {
    console.error('Cloudflare R2 Upload Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image to Cloudflare R2',
      },
      { status: 500 }
    );
  }
}
