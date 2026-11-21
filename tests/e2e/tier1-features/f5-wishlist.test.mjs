/**
 * Tier 1 Feature Test: F5 - Customer Wishlist & Item Persistence
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md § Feature 17
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertDeepEqual,
  assertThrows,
} from '../helpers/assertions.mjs';
import { mockProducts } from '../helpers/mock-data.mjs';
import { WishlistManager } from '../helpers/test-env.mjs';

describe('Tier 1: F5 - Customer Wishlist & Item Persistence', () => {
  let wishlist;
  const prodA = mockProducts[0];
  const prodB = mockProducts[1];
  const prodC = mockProducts[2];

  beforeEach(() => {
    wishlist = new WishlistManager();
  });

  test('F5.1: should add product to wishlist', () => {
    const items = wishlist.addItem(prodA.id);
    assertEqual(wishlist.getCount(), 1);
    assertEqual(wishlist.hasItem(prodA.id), true);
    assertDeepEqual(items, [prodA.id]);
  });

  test('F5.2: should prevent duplicate entries when adding same product multiple times', () => {
    wishlist.addItem(prodA.id);
    wishlist.addItem(prodA.id);
    wishlist.addItem(prodA.id);

    assertEqual(wishlist.getCount(), 1, 'Wishlist count should remain 1 when adding duplicate item');
    assertDeepEqual(wishlist.getItems(), [prodA.id]);
  });

  test('F5.3: should remove product from wishlist', () => {
    wishlist.addItem(prodA.id);
    wishlist.addItem(prodB.id);
    assertEqual(wishlist.getCount(), 2);

    wishlist.removeItem(prodA.id);
    assertEqual(wishlist.getCount(), 1);
    assertEqual(wishlist.hasItem(prodA.id), false);
    assertEqual(wishlist.hasItem(prodB.id), true);
  });

  test('F5.4: should accurately track wishlist count across multiple additions and removals', () => {
    assertEqual(wishlist.getCount(), 0);

    wishlist.addItem(prodA.id);
    wishlist.addItem(prodB.id);
    wishlist.addItem(prodC.id);
    assertEqual(wishlist.getCount(), 3);

    wishlist.removeItem(prodB.id);
    assertEqual(wishlist.getCount(), 2);

    wishlist.clear();
    assertEqual(wishlist.getCount(), 0);
  });

  test('F5.5: should gracefully handle empty wishlist queries and operations', () => {
    assertEqual(wishlist.getCount(), 0);
    assertDeepEqual(wishlist.getItems(), []);
    assertEqual(wishlist.hasItem(prodA.id), false);

    // Removing non-existent item should not throw
    wishlist.removeItem('non-existent-id');
    assertEqual(wishlist.getCount(), 0);
  });

  test('F5.6: should reject adding invalid or empty product IDs', async () => {
    await assertThrows(
      () => wishlist.addItem(''),
      /productId is required/i,
      'Should throw an error when adding empty productId'
    );
  });
});
