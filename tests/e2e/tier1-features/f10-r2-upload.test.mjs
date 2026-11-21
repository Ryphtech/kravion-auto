/**
 * Tier 1 Feature Test: F10 - Cloudflare R2 S3 Image Upload & CDN URL Generation
 * Requirement: ORIGINAL_REQUEST.md §R3, R4 & PROJECT.md § Cloudflare R2 Upload Contract
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertMatch,
  assertThrows,
} from '../helpers/assertions.mjs';
import { ENV_CONFIG, MockCloudflareR2Client } from '../helpers/test-env.mjs';

describe('Tier 1: F10 - Cloudflare R2 S3 Image Upload & CDN URL Generation', () => {
  let r2;

  beforeEach(() => {
    r2 = new MockCloudflareR2Client();
  });

  test('F10.1: should upload image to kravion-auto bucket and return public CDN URL', async () => {
    const key = `products/test-lip-${Date.now()}.webp`;
    const dummyBody = Buffer.from('FAKE_WEBP_IMAGE_BYTES');

    const result = await r2.putObject({
      Bucket: 'kravion-auto',
      Key: key,
      Body: dummyBody,
      ContentType: 'image/webp',
    });

    assertEqual(result.success, true);
    assertEqual(result.key, key);
    assertEqual(result.url, `${ENV_CONFIG.cloudflareR2.publicDevUrl}/${key}`);
  });

  test('F10.2: should accept valid image Content-Types (webp, jpeg, png)', async () => {
    const validMimes = ['image/webp', 'image/jpeg', 'image/png'];

    for (const mime of validMimes) {
      const ext = mime.split('/')[1];
      const key = `uploads/valid-asset-${Date.now()}.${ext}`;
      const res = await r2.putObject({
        Bucket: 'kravion-auto',
        Key: key,
        Body: Buffer.from('DATA'),
        ContentType: mime,
      });
      assertEqual(res.success, true);
    }
  });

  test('F10.3: should reject uploads to incorrect or unauthorized bucket name', async () => {
    await assertThrows(
      () =>
        r2.putObject({
          Bucket: 'wrong-unauthorized-bucket',
          Key: 'test.webp',
          Body: Buffer.from('DATA'),
          ContentType: 'image/webp',
        }),
      /invalid bucket name/i,
      'Should throw error on invalid bucket name'
    );
  });

  test('F10.4: should reject invalid or non-image Content-Types', async () => {
    await assertThrows(
      () =>
        r2.putObject({
          Bucket: 'kravion-auto',
          Key: 'script.exe',
          Body: Buffer.from('EXE_PAYLOAD'),
          ContentType: 'application/x-msdownload',
        }),
      /unsupported or invalid contenttype/i,
      'Should throw error on disallowed Content-Type'
    );
  });

  test('F10.5: should ensure uploaded object is retrievable and listable by key prefix', async () => {
    const prefix = 'products/carbon/';
    const key1 = `${prefix}part1.webp`;
    const key2 = `${prefix}part2.webp`;

    await r2.putObject({
      Bucket: 'kravion-auto',
      Key: key1,
      Body: Buffer.from('DATA1'),
      ContentType: 'image/webp',
    });
    await r2.putObject({
      Bucket: 'kravion-auto',
      Key: key2,
      Body: Buffer.from('DATA2'),
      ContentType: 'image/webp',
    });

    const items = await r2.listObjects({
      Bucket: 'kravion-auto',
      Prefix: prefix,
    });

    assertEqual(items.length, 2, 'Should list both uploaded objects with prefix');
    const item1 = await r2.getObject({ Bucket: 'kravion-auto', Key: key1 });
    assertEqual(item1.key, key1);
  });
});
