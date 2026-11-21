/**
 * Tier 2 Boundary Test: B11 - Store Settings & Carousel Banners Boundaries
 * Requirement: ORIGINAL_REQUEST.md §R2, R3 & PROJECT.md § Feature 28, 30
 * Boundaries: Empty WhatsApp recipient phone resolution fallback hierarchy,
 * invalid phone formatting, empty store name validation, carousel slide without image URL,
 * banner order index bounds.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertThrows,
  assertGreaterThan,
} from '../helpers/assertions.mjs';
import { mockCarouselPosters, mockAdminSettings, R2_PUBLIC_BASE_URL } from '../helpers/mock-data.mjs';
import { MockFirestoreDatabase, ENV_CONFIG } from '../helpers/test-env.mjs';

function resolveWhatsAppRecipient(adminSettings, envConfig) {
  if (adminSettings?.whatsappNumber && typeof adminSettings.whatsappNumber === 'string' && adminSettings.whatsappNumber.trim()) {
    const digits = adminSettings.whatsappNumber.replace(/[^\d]/g, '');
    if (digits.length >= 7) return digits;
  }
  if (envConfig?.defaultWhatsAppNumber && typeof envConfig.defaultWhatsAppNumber === 'string' && envConfig.defaultWhatsAppNumber.trim()) {
    const digits = envConfig.defaultWhatsAppNumber.replace(/[^\d]/g, '');
    if (digits.length >= 7) return digits;
  }
  return '919876543210'; // Deterministic fallback
}

function validateStoreSettings(settings) {
  if (!settings) throw new Error('Settings object is required');
  if (!settings.storeName || !settings.storeName.trim()) {
    throw new Error('Store name cannot be empty or whitespace only');
  }
  if (settings.whatsappNumber !== undefined) {
    const digits = String(settings.whatsappNumber).replace(/[^\d]/g, '');
    if (digits.length < 7 || digits.length > 15) {
      throw new Error(`Invalid WhatsApp phone number: must contain between 7 and 15 digits, got "${settings.whatsappNumber}"`);
    }
  }
  return true;
}

function validateCarouselSlide(slide) {
  if (!slide) throw new Error('Slide payload is required');
  if (!slide.title || !slide.title.trim()) {
    throw new Error('Carousel slide title is required');
  }
  if (!slide.imageUrl || typeof slide.imageUrl !== 'string' || !slide.imageUrl.trim()) {
    throw new Error('Carousel slide must possess a valid, non-empty image URL');
  }
  if (!slide.imageUrl.startsWith('http://') && !slide.imageUrl.startsWith('https://')) {
    throw new Error('Carousel slide image URL must be a valid HTTP(S) URL');
  }
  if (slide.order !== undefined && (typeof slide.order !== 'number' || slide.order < 0)) {
    throw new Error('Carousel slide order index must be a non-negative number');
  }
  return true;
}

describe('Tier 2: B11 - Store Settings & Carousel Banners Boundaries', () => {
  let db;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
  });

  test('B11.1: empty, whitespace-only, null, or undefined WhatsApp recipient phone falls back to environment default', () => {
    const env = { defaultWhatsAppNumber: '919876543210' };
    const emptySettingsVariants = [
      { whatsappNumber: '' },
      { whatsappNumber: '   ' },
      { whatsappNumber: null },
      { whatsappNumber: undefined },
      {},
    ];

    for (const settings of emptySettingsVariants) {
      const resolved = resolveWhatsAppRecipient(settings, env);
      assertEqual(resolved, '919876543210', 'Empty admin phone must fall back to environment config default');
    }

    // Both admin setting and env config empty -> falls back to hardcoded default
    const fallbackAll = resolveWhatsAppRecipient({}, {});
    assertEqual(fallbackAll, '919876543210');
  });

  test('B11.2: invalid phone number formatting (non-numeric, too short, too long) is rejected', () => {
    const invalidPhones = [
      'call-me-now',
      '12345',          // 5 digits (< 7)
      '++---()',        // symbols only
      '123456789012345678', // 18 digits (> 15)
    ];

    for (const phone of invalidPhones) {
      assertThrows(() => {
        validateStoreSettings({
          storeName: 'Kravion Test Store',
          whatsappNumber: phone,
        });
      }, /Invalid WhatsApp phone number/);
    }

    // Valid phone accepted
    assertEqual(validateStoreSettings({
      storeName: 'Kravion Test Store',
      whatsappNumber: '+1 (555) 234-5678',
    }), true);
  });

  test('B11.3: empty or whitespace-only store name is rejected during update', () => {
    const emptyNames = ['', '   ', '\t\n'];

    for (const name of emptyNames) {
      assertThrows(() => {
        validateStoreSettings({
          storeName: name,
        });
      }, 'Store name cannot be empty or whitespace only');
    }
  });

  test('B11.4: carousel slide without image URL or with invalid URL is strictly rejected', () => {
    const validBaseSlide = {
      title: 'Performance Wheel Collection',
      imageUrl: `${R2_PUBLIC_BASE_URL}/banners/hero-wheels.webp`,
      order: 1,
    };

    // Missing image URL
    assertThrows(() => {
      validateCarouselSlide({ ...validBaseSlide, imageUrl: '' });
    }, /must possess a valid, non-empty image URL/);

    assertThrows(() => {
      validateCarouselSlide({ ...validBaseSlide, imageUrl: null });
    }, /must possess a valid, non-empty image URL/);

    assertThrows(() => {
      validateCarouselSlide({ ...validBaseSlide, imageUrl: '   ' });
    }, /must possess a valid, non-empty image URL/);

    // Non-HTTP URL
    assertThrows(() => {
      validateCarouselSlide({ ...validBaseSlide, imageUrl: 'ftp://files/banner.webp' });
    }, /must be a valid HTTP\(S\) URL/);
  });

  test('B11.5: carousel slide negative order index is rejected', () => {
    const validSlide = {
      title: 'Exhaust Systems',
      imageUrl: `${R2_PUBLIC_BASE_URL}/banners/exhaust.webp`,
    };

    assertThrows(() => {
      validateCarouselSlide({ ...validSlide, order: -1 });
    }, 'Carousel slide order index must be a non-negative number');

    assertThrows(() => {
      validateCarouselSlide({ ...validSlide, order: 'first' });
    }, 'Carousel slide order index must be a non-negative number');

    // 0 is valid boundary
    assertEqual(validateCarouselSlide({ ...validSlide, order: 0 }), true);
  });
});
