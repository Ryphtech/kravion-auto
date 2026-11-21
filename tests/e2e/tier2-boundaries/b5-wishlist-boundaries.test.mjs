/**
 * Tier 2 Boundary Test: B5 - Customer Wishlist Boundaries & Deduplication
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md § Feature 17
 * Boundaries: Rapid duplicate addition, adding nonexistent catalog item,
 * removing nonexistent item, clearing already-empty wishlist, max item capacity stress.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertThrows,
  assertGreaterThan,
} from '../helpers/assertions.mjs';
import { mockProducts } from '../helpers/mock-data.mjs';
import { WishlistManager } from '../helpers/test-env.mjs';

class ValidatedWishlistManager extends WishlistManager {
  constructor(options = {}) {
    super();
    this.maxItems = options.maxItems ?? 100;
    this.catalog = options.catalog ?? mockProducts;
  }

  addItem(productId) {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      throw new Error('productId is required and must be a non-empty string');
    }
    const cleanId = productId.trim();

    // Catalog existence guard
    const existsInCatalog = this.catalog.some(p => p.id === cleanId);
    if (!existsInCatalog) {
      throw new Error(`Product ${cleanId} does not exist in catalog`);
    }

    if (this.items.size >= this.maxItems && !this.items.has(cleanId)) {
      throw new Error(`Wishlist capacity limit of ${this.maxItems} items exceeded`);
    }

    this.items.add(cleanId);
    return Array.from(this.items);
  }
}

describe('Tier 2: B5 - Customer Wishlist Boundaries & Deduplication', () => {
  let wishlist;

  beforeEach(() => {
    wishlist = new ValidatedWishlistManager({ maxItems: 10, catalog: mockProducts });
  });

  test('B5.1: rapid duplicate additions of the same product ID maintains strict idempotency (count = 1)', () => {
    const targetId = mockProducts[0].id;

    // Add same product 50 times in rapid loop
    for (let i = 0; i < 50; i++) {
      wishlist.addItem(targetId);
    }

    assertEqual(wishlist.getCount(), 1, 'Duplicate additions must result in exactly 1 item in wishlist');
    assertEqual(wishlist.hasItem(targetId), true);
    assertEqual(wishlist.getItems()[0], targetId);
  });

  test('B5.2: adding item not present in catalog throws clear validation error', () => {
    const nonExistentId = 'phantom-prod-xyz-9999';

    assertThrows(() => {
      wishlist.addItem(nonExistentId);
    }, /does not exist in catalog/);

    assertEqual(wishlist.getCount(), 0);
  });

  test('B5.3: removing nonexistent item from populated or empty wishlist is a safe, non-throwing no-op', () => {
    const validId = mockProducts[0].id;
    wishlist.addItem(validId);
    assertEqual(wishlist.getCount(), 1);

    // Remove item that does not exist
    const items = wishlist.removeItem('non-existent-product-id');
    assertEqual(wishlist.getCount(), 1, 'Count must remain 1 after attempting to remove non-existent item');
    assertEqual(items.length, 1);
    assertEqual(items[0], validId);
  });

  test('B5.4: clearing an already-empty wishlist is idempotent and safe', () => {
    assertEqual(wishlist.getCount(), 0);

    wishlist.clear();
    assertEqual(wishlist.getCount(), 0);

    // Second clear
    wishlist.clear();
    assertEqual(wishlist.getCount(), 0);
    assertEqual(wishlist.getItems().length, 0);
  });

  test('B5.5: invalid inputs (null, undefined, empty string, whitespace) are strictly rejected', () => {
    assertThrows(() => wishlist.addItem(''), /productId is required/);
    assertThrows(() => wishlist.addItem('   '), /productId is required/);
    assertThrows(() => wishlist.addItem(null), /productId is required/);
    assertThrows(() => wishlist.addItem(undefined), /productId is required/);
    assertThrows(() => wishlist.addItem(12345), /productId is required/);
  });

  test('B5.6: wishlist capacity boundary: adding beyond max limit is safely blocked', () => {
    const smallWishlist = new ValidatedWishlistManager({
      maxItems: 3,
      catalog: mockProducts,
    });

    // Fill to capacity (3 items)
    smallWishlist.addItem(mockProducts[0].id);
    smallWishlist.addItem(mockProducts[1].id);
    smallWishlist.addItem(mockProducts[2].id);
    assertEqual(smallWishlist.getCount(), 3);

    // Adding an existing item does not exceed limit (idempotent)
    smallWishlist.addItem(mockProducts[0].id);
    assertEqual(smallWishlist.getCount(), 3);

    // Adding 4th distinct item exceeds capacity
    assertThrows(() => {
      smallWishlist.addItem(mockProducts[3].id);
    }, /Wishlist capacity limit of 3 items exceeded/);

    assertEqual(smallWishlist.getCount(), 3);
  });
});
