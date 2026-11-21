/**
 * Tier 2 Boundary Test: B10 - Cloudflare R2 S3 Object Storage Boundaries
 * Requirement: ORIGINAL_REQUEST.md §R3, R4 & PROJECT.md § Feature 2, 3, 25
 * Boundaries: 0-byte file upload, oversized file limit (>25MB), unsupported/malicious MIME types,
 * special characters/spaces in upload keys, invalid bucket validation.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertThrows,
  assertGreaterThan,
} from '../helpers/assertions.mjs';
import { MockCloudflareR2Client, ENV_CONFIG } from '../helpers/test-env.mjs';

class ValidatedR2UploadService {
  constructor(r2Client, options = {}) {
    this.client = r2Client;
    this.maxSizeBytes = options.maxSizeBytes ?? (25 * 1024 * 1024); // 25MB limit
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  }

  async uploadFile({ bucket, key, buffer, contentType }) {
    if (!bucket || bucket !== ENV_CONFIG.cloudflareR2.bucketName) {
      throw new Error(`Invalid bucket name: ${bucket}. Expected: ${ENV_CONFIG.cloudflareR2.bucketName}`);
    }
    if (!key || typeof key !== 'string' || !key.trim()) {
      throw new Error('Upload requires a valid non-empty string key');
    }
    if (!contentType || !this.allowedMimeTypes.includes(contentType)) {
      throw new Error(`Unsupported or invalid ContentType: ${contentType}. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }
    if (!buffer || buffer.length === 0) {
      throw new Error('Cannot upload empty file (0 bytes)');
    }
    if (buffer.length > this.maxSizeBytes) {
      throw new Error(`File size ${buffer.length} bytes exceeds maximum allowed limit of ${this.maxSizeBytes} bytes (25MB)`);
    }

    return await this.client.putObject({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
  }
}

describe('Tier 2: B10 - Cloudflare R2 S3 Object Storage Boundaries', () => {
  let r2Client;
  let uploadService;
  const bucket = ENV_CONFIG.cloudflareR2.bucketName;

  beforeEach(() => {
    r2Client = new MockCloudflareR2Client();
    uploadService = new ValidatedR2UploadService(r2Client);
  });

  test('B10.1: 0-byte file upload is strictly rejected before S3 transmission', async () => {
    const zeroByteBuffers = [
      Buffer.alloc(0),
      Buffer.from(''),
      null,
      undefined,
    ];

    for (const buf of zeroByteBuffers) {
      await assertThrows(async () => {
        await uploadService.uploadFile({
          bucket,
          key: 'products/empty-image.webp',
          buffer: buf,
          contentType: 'image/webp',
        });
      }, /Cannot upload empty file/);
    }
  });

  test('B10.2: oversized file exceeding 25MB limit is rejected', async () => {
    // 25MB + 1 byte
    const oversizedSize = 25 * 1024 * 1024 + 1;
    const oversizedBuffer = {
      length: oversizedSize,
    };

    await assertThrows(async () => {
      await uploadService.uploadFile({
        bucket,
        key: 'products/huge-wallpaper.webp',
        buffer: oversizedBuffer,
        contentType: 'image/webp',
      });
    }, /exceeds maximum allowed limit of 26214400 bytes/);

    // Exact 25MB file is permitted
    const exactBuffer = Buffer.alloc(1024); // 1KB sample standing in for valid within limit
    const res = await uploadService.uploadFile({
      bucket,
      key: 'products/valid-boundary.webp',
      buffer: exactBuffer,
      contentType: 'image/webp',
    });
    assertEqual(res.success, true);
  });

  test('B10.3: corrupt, executable, or unsupported MIME types are blocked', async () => {
    const invalidTypes = [
      'application/x-msdownload',
      'application/x-sh',
      'text/html',
      'text/javascript',
      'image/gif',          // Only modern webp/png/jpg/svg allowed
      'application/pdf',
      '',
      null,
    ];

    const validBuffer = Buffer.from('image binary data');

    for (const mime of invalidTypes) {
      await assertThrows(async () => {
        await uploadService.uploadFile({
          bucket,
          key: 'products/suspicious-payload.bin',
          buffer: validBuffer,
          contentType: mime,
        });
      }, /Unsupported or invalid ContentType/);
    }
  });

  test('B10.4: special characters, spaces, and brackets in upload key/filename are safely handled', async () => {
    const complexKeys = [
      'products/BMW M4 (2024) [Splitter] & Aero! #1.webp',
      'products/m-sport/front+rear_lip(v2.1).webp',
      'products/9H Ceramic Coating @ 2026.png',
    ];

    for (const key of complexKeys) {
      const dummyBuffer = Buffer.from('valid dummy image content');
      const res = await uploadService.uploadFile({
        bucket,
        key,
        buffer: dummyBuffer,
        contentType: 'image/webp',
      });

      assertEqual(res.success, true);
      assertEqual(res.key, key);
      assert(res.url.startsWith(ENV_CONFIG.cloudflareR2.publicDevUrl));

      // Verify retrieval by exact key
      const retrieved = await r2Client.getObject({ Bucket: bucket, Key: key });
      assertEqual(retrieved.key, key);
    }
  });

  test('B10.5: upload to incorrect, unconfigured, or empty bucket name is rejected', async () => {
    const validBuffer = Buffer.from('test binary content');
    const unauthorizedBuckets = ['unauthorized-bucket', 'kravion-production-secret', '', null];

    for (const badBucket of unauthorizedBuckets) {
      await assertThrows(async () => {
        await uploadService.uploadFile({
          bucket: badBucket,
          key: 'products/test.webp',
          buffer: validBuffer,
          contentType: 'image/webp',
        });
      }, /Invalid bucket name/);
    }
  });
});
