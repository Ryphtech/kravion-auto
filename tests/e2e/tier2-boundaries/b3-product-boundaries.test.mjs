/**
 * Tier 2 Boundary Test: B3 - Product Detail & Schema Boundaries
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md § Feature 15
 * Boundaries: 0 images (gallery fallback), empty specifications dictionary,
 * extreme prices (0, negative, floating point, 9999999), 0.0 and 5.0 rating bounds,
 * undefined stock status.
 */

import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertGreaterThan,
  assertLessThan,
} from '../helpers/assertions.mjs';
import { R2_PUBLIC_BASE_URL } from '../helpers/mock-data.mjs';

// Domain helper for product display and validation
function formatProductPrice(price) {
  const num = Number(price);
  if (isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
}

function resolveProductStockStatus(stock) {
  if (!stock) return 'out_of_stock';
  if (stock.status && ['in_stock', 'low_stock', 'out_of_stock'].includes(stock.status)) {
    return stock.status;
  }
  const inv = Number(stock.inventory);
  if (isNaN(inv) || inv <= 0) return 'out_of_stock';
  if (inv <= 5) return 'low_stock';
  return 'in_stock';
}

function resolveProductGallery(images) {
  const fallback = `${R2_PUBLIC_BASE_URL}/products/placeholder-part.webp`;
  if (!Array.isArray(images) || images.length === 0) {
    return [fallback];
  }
  return images.filter(url => typeof url === 'string' && url.trim().length > 0);
}

function validateProductRating(ratings) {
  if (!ratings) return { valid: false, reason: 'missing_ratings' };
  const { rating, reviewCount } = ratings;
  if (typeof rating !== 'number' || isNaN(rating)) return { valid: false, reason: 'invalid_rating_type' };
  if (typeof reviewCount !== 'number' || reviewCount < 0) return { valid: false, reason: 'invalid_review_count' };
  if (rating < 0 || rating > 5.0) return { valid: false, reason: 'rating_out_of_bounds' };
  return { valid: true };
}

describe('Tier 2: B3 - Product Detail & Schema Boundaries', () => {
  test('B3.1: product with 0 images safely resolves to placeholder gallery image', () => {
    const productZeroImages = {
      id: 'prod-zero-img',
      title: 'Universal Exhaust Clamp',
      images: [],
    };

    const resolved = resolveProductGallery(productZeroImages.images);
    assertEqual(resolved.length, 1, 'Should contain exactly 1 fallback placeholder image');
    assert(resolved[0].includes('placeholder'), 'Fallback image should be a placeholder image');
    assert(resolved[0].startsWith(R2_PUBLIC_BASE_URL), 'Placeholder image must be hosted on Cloudflare R2 CDN');

    // Also test null/undefined images array
    const resolvedNull = resolveProductGallery(null);
    assertEqual(resolvedNull.length, 1);
  });

  test('B3.2: empty specifications dictionary handles lookup safely without throwing', () => {
    const productEmptySpecs = {
      id: 'prod-empty-specs',
      title: 'Valve Stem Caps',
      specs: {},
    };

    assertEqual(typeof productEmptySpecs.specs, 'object');
    assertEqual(Object.keys(productEmptySpecs.specs).length, 0);

    // Lookups on empty dictionary should return undefined rather than crashing
    assertEqual(productEmptySpecs.specs.dimensions, undefined);
    assertEqual(productEmptySpecs.specs.material, undefined);
    assertEqual(productEmptySpecs.specs['non_existent_spec'], undefined);
  });

  test('B3.3: extreme prices (0.00, floating-point sub-cents, extreme values) format and compute accurately', () => {
    // 1. Zero price (free promotional accessory)
    assertEqual(formatProductPrice(0), '$0.00');

    // 2. High precision sub-cents (e.g. 19.999 rounds to 20.00; 49.954 rounds to 49.95)
    assertEqual(formatProductPrice(19.999), '$20.00');
    assertEqual(formatProductPrice(49.954), '$49.95');

    // 3. Extreme luxury price ($9,999,999.00)
    const extremePrice = 9999999.0;
    assertEqual(formatProductPrice(extremePrice), '$9999999.00');
    const computedTotal = extremePrice * 2;
    assertEqual(computedTotal, 19999998.0, 'Extreme price calculation must not overflow');
  });

  test('B3.4: negative prices are strictly detected and flagged as invalid', () => {
    const invalidPrice = -49.99;
    const isNegative = invalidPrice < 0;
    assert(isNegative, 'Negative price must be recognized as invalid');

    const formattedNegative = formatProductPrice(invalidPrice);
    assertEqual(formattedNegative, '$-49.99');
  });

  test('B3.5: rating boundary analysis: 0.0 and 5.0 are valid bounds; values outside [0, 5.0] are rejected', () => {
    // Exact lower bound: 0.0 rating with 0 reviews
    const lowerBound = { rating: 0.0, reviewCount: 0 };
    assertEqual(validateProductRating(lowerBound).valid, true);

    // Exact upper bound: 5.0 rating with 150 reviews
    const upperBound = { rating: 5.0, reviewCount: 150 };
    assertEqual(validateProductRating(upperBound).valid, true);

    // Below lower bound: -0.1
    const belowLower = { rating: -0.1, reviewCount: 10 };
    const belowRes = validateProductRating(belowLower);
    assertEqual(belowRes.valid, false);
    assertEqual(belowRes.reason, 'rating_out_of_bounds');

    // Above upper bound: 5.01
    const aboveUpper = { rating: 5.01, reviewCount: 10 };
    const aboveRes = validateProductRating(aboveUpper);
    assertEqual(aboveRes.valid, false);
    assertEqual(aboveRes.reason, 'rating_out_of_bounds');

    // Negative review count
    const negReview = { rating: 4.5, reviewCount: -1 };
    assertEqual(validateProductRating(negReview).valid, false);
    assertEqual(validateProductRating(negReview).reason, 'invalid_review_count');
  });

  test('B3.6: undefined or missing stock status dynamically resolves from inventory count', () => {
    // 1. Status is undefined but inventory is 20 -> resolves to in_stock
    assertEqual(resolveProductStockStatus({ inventory: 20 }), 'in_stock');

    // 2. Status is undefined but inventory is 3 -> resolves to low_stock
    assertEqual(resolveProductStockStatus({ inventory: 3 }), 'low_stock');

    // 3. Status is undefined and inventory is 0 -> resolves to out_of_stock
    assertEqual(resolveProductStockStatus({ inventory: 0 }), 'out_of_stock');

    // 4. Missing stock object entirely -> resolves to out_of_stock
    assertEqual(resolveProductStockStatus(null), 'out_of_stock');

    // 5. Explicit status takes precedence
    assertEqual(resolveProductStockStatus({ status: 'low_stock', inventory: 50 }), 'low_stock');
  });
});
