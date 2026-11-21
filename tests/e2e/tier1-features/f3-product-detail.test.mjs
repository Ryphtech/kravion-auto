/**
 * Tier 1 Feature Test: F3 - Product Detail & Cloudflare R2 CDN Gallery
 * Requirement: ORIGINAL_REQUEST.md §R1, R4 & PROJECT.md § Feature 15
 */

import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertGreaterThan,
  assertMatch,
  assertIncludes,
} from '../helpers/assertions.mjs';
import { mockProducts, R2_PUBLIC_BASE_URL, mockVehicles } from '../helpers/mock-data.mjs';
import { checkCompatibility } from '../helpers/test-env.mjs';

describe('Tier 1: F3 - Product Detail & Cloudflare R2 CDN Gallery', () => {
  const sampleProduct = mockProducts[0];

  test('F3.1: all product images must be hosted on Cloudflare R2 public distribution domain', () => {
    for (const prod of mockProducts) {
      assert(Array.isArray(prod.images), `Product ${prod.id} must have images array`);
      assertGreaterThan(prod.images.length, 0, `Product ${prod.id} must have at least one image`);

      for (const imgUrl of prod.images) {
        assert(
          imgUrl.startsWith(R2_PUBLIC_BASE_URL),
          `Image URL "${imgUrl}" must start with Cloudflare R2 public CDN URL "${R2_PUBLIC_BASE_URL}"`
        );
        assertMatch(
          imgUrl,
          /\.(webp|jpg|jpeg|png|svg)$/i,
          `Image URL "${imgUrl}" must have a valid web image extension`
        );
      }
    }
  });

  test('F3.2: product specifications must include dimensions, weight, material, and warranty', () => {
    assert(sampleProduct.specs, 'Product must include a specs object');
    assert(sampleProduct.specs.dimensions, 'Specs must have dimensions');
    assert(sampleProduct.specs.weight, 'Specs must have weight');
    assert(sampleProduct.specs.material, 'Specs must have material');
    assert(sampleProduct.specs.warranty, 'Specs must have warranty');

    assertIncludes(sampleProduct.specs.warranty, 'Warranty');
  });

  test('F3.3: product ratings must have valid numeric range (1.0 to 5.0) and non-negative reviewCount', () => {
    for (const prod of mockProducts) {
      assert(prod.ratings, `Product ${prod.id} must have ratings`);
      assertGreaterThan(prod.ratings.rating, 0.99);
      assert(prod.ratings.rating <= 5.0, `Rating ${prod.ratings.rating} exceeds maximum 5.0`);
      assert(prod.ratings.reviewCount >= 0, `Review count must be non-negative`);
    }
  });

  test('F3.4: stock status and inventory count validation', () => {
    const validStatuses = ['in_stock', 'low_stock', 'out_of_stock'];
    for (const prod of mockProducts) {
      assert(prod.stock, `Product ${prod.id} must have stock information`);
      assertIncludes(validStatuses, prod.stock.status, `Invalid stock status: ${prod.stock.status}`);
      assert(typeof prod.stock.inventory === 'number' && prod.stock.inventory >= 0);
    }
  });

  test('F3.5: dynamic vehicle fitment badge on product detail page reflects selected vehicle', () => {
    const bmw = mockVehicles.find(v => v.id === 'bmw-3-g20');
    const audi = mockVehicles.find(v => v.id === 'audi-a4-b9');

    // BMW front lip on BMW
    const badgeOnMatch = checkCompatibility(sampleProduct, bmw);
    assertEqual(badgeOnMatch.compatible, true);
    assertEqual(badgeOnMatch.reason, 'exact_match');

    // BMW front lip on Audi
    const badgeOnMismatch = checkCompatibility(sampleProduct, audi);
    assertEqual(badgeOnMismatch.compatible, false);
    assertEqual(badgeOnMismatch.reason, 'incompatible');
  });
});
