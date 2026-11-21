/**
 * Tier 1 Feature Test: F11 - Admin Banners/Posters & Store/WhatsApp Settings
 * Requirement: ORIGINAL_REQUEST.md §R2, R3 & PROJECT.md § Feature 28, 30
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertGreaterThan,
  assertDeepEqual,
} from '../helpers/assertions.mjs';
import { mockCarouselPosters, mockAdminSettings, R2_PUBLIC_BASE_URL } from '../helpers/mock-data.mjs';
import { MockFirestoreDatabase, formatWhatsAppUrl } from '../helpers/test-env.mjs';

function resolveWhatsAppRecipient(adminSettings, envConfig) {
  if (adminSettings?.whatsappNumber && adminSettings.whatsappNumber.trim()) {
    return adminSettings.whatsappNumber.trim();
  }
  if (envConfig?.defaultWhatsAppNumber && envConfig.defaultWhatsAppNumber.trim()) {
    return envConfig.defaultWhatsAppNumber.trim();
  }
  return '919876543210'; // Safe fallback
}

describe('Tier 1: F11 - Admin Banners/Posters & Store/WhatsApp Settings', () => {
  let db;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
  });

  test('F11.1: should read and create homepage carousel banner slide', async () => {
    const banners = await db.queryDocs('banners');
    assertGreaterThan(banners.length, 0, 'Should have initial carousel banners');

    const newBanner = {
      id: 'banner-test-new-1',
      title: 'Monoblock Forged Aero Series Wheels',
      subtitle: 'Ultralight aerospace aluminum wheels designed for track and street',
      imageUrl: `${R2_PUBLIC_BASE_URL}/banners/hero-wheels-track.webp`,
      link: '/products?category=wheels',
      order: 4,
      isActive: true,
    };

    await db.setDoc('banners', newBanner.id, newBanner);
    const retrieved = await db.getDoc('banners', newBanner.id);

    assert(retrieved, 'New banner must be created and retrievable');
    assertEqual(retrieved.title, newBanner.title);
    assertEqual(retrieved.order, 4);
    assertEqual(retrieved.isActive, true);
  });

  test('F11.2: should update store contact information and address', async () => {
    const current = await db.getDoc('settings', 'store');
    assert(current, 'Store settings must exist');

    const updates = {
      storeName: 'Kravion Auto Performance & Engineering',
      supportEmail: 'orders@kravion.com',
      contactPhone: '+1-800-KRAVION',
    };

    const updated = await db.updateDoc('settings', 'store', updates);
    assertEqual(updated.storeName, 'Kravion Auto Performance & Engineering');
    assertEqual(updated.supportEmail, 'orders@kravion.com');
    assertEqual(updated.contactPhone, '+1-800-KRAVION');
  });

  test('F11.3: WhatsApp recipient phone resolution: Admin setting overrides fallback', () => {
    const adminSettings = { whatsappNumber: '18005550199' };
    const envConfig = { defaultWhatsAppNumber: '919876543210' };

    const resolved = resolveWhatsAppRecipient(adminSettings, envConfig);
    assertEqual(resolved, '18005550199', 'Admin setting should take precedence over envConfig');
  });

  test('F11.4: WhatsApp recipient phone resolution fallback hierarchy when admin setting is missing or empty', () => {
    const emptyAdminSettings = { whatsappNumber: '   ' };
    const envConfig = { defaultWhatsAppNumber: '919876543210' };

    const resolved = resolveWhatsAppRecipient(emptyAdminSettings, envConfig);
    assertEqual(resolved, '919876543210', 'Empty admin setting should fall back to environment default');

    const emptyEnvConfig = {};
    const fallbackDefault = resolveWhatsAppRecipient(emptyAdminSettings, emptyEnvConfig);
    assertEqual(fallbackDefault, '919876543210', 'Should fall back to default placeholder if both empty');
  });

  test('F11.5: should toggle banner active status and re-order banners', async () => {
    const targetBannerId = 'banner-hero-1';
    await db.updateDoc('banners', targetBannerId, { isActive: false, order: 99 });

    const updated = await db.getDoc('banners', targetBannerId);
    assertEqual(updated.isActive, false);
    assertEqual(updated.order, 99);

    // Verify querying active banners excludes the toggled banner
    const activeBanners = await db.queryDocs('banners', b => b.isActive === true);
    const found = activeBanners.find(b => b.id === targetBannerId);
    assertEqual(found, undefined, 'Deactivated banner must not appear in active banner list');
  });
});
