/**
 * Tier 4 - Scenario 4: Authenticated Session Sync, Wishlist Migration & Cart Persistence
 * Specification: TEST_INFRA.md § Real-World Application Scenarios (Scenario 4)
 * Features Exercised: F4, F5, F6
 *
 * Flow:
 * 1. Guest user browses storefront unauthenticated:
 *    - Adds BMW Front Splitter to local guest wishlist.
 *    - Adds Kravion 9H Ceramic Coating Kit (x1) to local guest cart.
 * 2. Guest attempts to proceed to /checkout:
 *    - Pre-checkout auth guard intercepts with redirect to /login?redirect=/checkout.
 * 3. Customer signs in using Firebase Authentication (Email/Password credentials):
 *    - Prior cloud account state contains an existing wishlist item (German LED Indicators)
 *      and an existing cloud cart item (Nappa Leather Cushion x1, Ceramic Kit x1).
 * 4. Merging Engine activates:
 *    - Wishlist: Merges guest wishlist and cloud wishlist into a deduplicated set.
 *    - Cart: Merges guest cart items with cloud cart items, summing matching item quantities
 *      and preserving distinct items.
 *    - Persists merged snapshot to Firestore under customer UID.
 * 5. Re-evaluates /checkout route guard -> allowed: true.
 * 6. Customer logs out and logs back in on a fresh browser instance:
 *    - Restores persistent wishlist and cart state from Firestore with full fidelity.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertDeepEqual,
  assertIncludes,
} from '../helpers/assertions.mjs';
import {
  mockProducts,
  mockUserSessions,
} from '../helpers/mock-data.mjs';
import {
  MockFirestoreDatabase,
  WishlistManager,
  calculateCartTotals,
  checkAuthGuard,
} from '../helpers/test-env.mjs';

describe('Tier 4: Scenario 4 - Authenticated Session Sync, Wishlist Migration & Cart Persistence', () => {
  let db;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
  });

  test('merges guest cart and wishlist upon Firebase authentication and persists across session restarts', async () => {
    // -----------------------------------------------------------------------
    // Step 1: Unauthenticated Guest Browsing & Local Storage Population
    // -----------------------------------------------------------------------
    let activeUser = mockUserSessions.guestUser; // null
    const guestWishlist = new WishlistManager();
    const guestCart = [];

    // Guest adds item to local wishlist
    guestWishlist.addItem('prod-single-bmw-lip');
    assertEqual(guestWishlist.getCount(), 1);

    // Guest adds item to local cart
    const ceramicKit = mockProducts.find(p => p.id === 'prod-universal-ceramic-kit');
    assert(ceramicKit, 'Ceramic kit product fixture must exist');
    guestCart.push({
      productId: ceramicKit.id,
      title: ceramicKit.title,
      price: ceramicKit.price,
      quantity: 1,
    });
    assertEqual(guestCart.length, 1);

    // -----------------------------------------------------------------------
    // Step 2: Unauthenticated Access to Checkout is Blocked by Auth Guard
    // -----------------------------------------------------------------------
    const checkoutGate = checkAuthGuard(activeUser, '/checkout');
    assertEqual(checkoutGate.allowed, false);
    assertEqual(checkoutGate.reason, 'unauthenticated');
    assertEqual(checkoutGate.redirectUrl, '/login?redirect=%2Fcheckout');

    // Account route is also protected
    const accountGate = checkAuthGuard(activeUser, '/account');
    assertEqual(accountGate.allowed, false);

    // -----------------------------------------------------------------------
    // Step 3: Seed Pre-existing Cloud State in Firestore for Registered Customer
    // -----------------------------------------------------------------------
    const customer = mockUserSessions.customerUser;
    const nappaCushion = mockProducts.find(p => p.id === 'prod-universal-nappa-cushion');
    assert(nappaCushion, 'Nappa cushion product fixture must exist');

    // Pre-existing cloud wishlist: contains 'prod-multi-german-led'
    await db.setDoc('user_wishlists', customer.uid, {
      userId: customer.uid,
      items: ['prod-multi-german-led'],
      updatedAt: '2026-11-20T10:00:00.000Z',
    });

    // Pre-existing cloud cart: contains ceramic kit (x1) and nappa cushion (x1)
    await db.setDoc('user_carts', customer.uid, {
      userId: customer.uid,
      items: [
        { productId: ceramicKit.id, title: ceramicKit.title, price: ceramicKit.price, quantity: 1 },
        { productId: nappaCushion.id, title: nappaCushion.title, price: nappaCushion.price, quantity: 1 },
      ],
      updatedAt: '2026-11-20T10:00:00.000Z',
    });

    // -----------------------------------------------------------------------
    // Step 4: Customer Authenticates & Migration Engine Merges State
    // -----------------------------------------------------------------------
    activeUser = customer;
    assertEqual(activeUser.role, 'customer');

    // 4a. Merge Wishlists
    const cloudWishlistDoc = await db.getDoc('user_wishlists', activeUser.uid);
    const mergedWishlist = new WishlistManager();

    // Add guest items
    guestWishlist.getItems().forEach(id => mergedWishlist.addItem(id));
    // Add existing cloud items
    if (cloudWishlistDoc && Array.isArray(cloudWishlistDoc.items)) {
      cloudWishlistDoc.items.forEach(id => mergedWishlist.addItem(id));
    }

    assertEqual(mergedWishlist.getCount(), 2);
    assert(mergedWishlist.hasItem('prod-single-bmw-lip'));
    assert(mergedWishlist.hasItem('prod-multi-german-led'));

    // Persist merged wishlist to Firestore
    await db.setDoc('user_wishlists', activeUser.uid, {
      userId: activeUser.uid,
      items: mergedWishlist.getItems(),
      updatedAt: new Date().toISOString(),
    });

    // 4b. Merge Carts
    const cloudCartDoc = await db.getDoc('user_carts', activeUser.uid);
    const cartMap = new Map();

    // Helper: merge items by summing quantities
    const addCartItemsToMap = (items) => {
      for (const item of items) {
        if (cartMap.has(item.productId)) {
          const cur = cartMap.get(item.productId);
          cur.quantity += item.quantity;
        } else {
          cartMap.set(item.productId, { ...item });
        }
      }
    };

    if (cloudCartDoc && Array.isArray(cloudCartDoc.items)) {
      addCartItemsToMap(cloudCartDoc.items);
    }
    addCartItemsToMap(guestCart);

    const mergedCart = Array.from(cartMap.values());
    assertEqual(mergedCart.length, 2);

    // Ceramic kit quantity should sum to 1 (guest) + 1 (cloud) = 2
    const mergedCeramic = mergedCart.find(i => i.productId === ceramicKit.id);
    assertEqual(mergedCeramic.quantity, 2);

    // Nappa cushion should be preserved with quantity 1
    const mergedCushion = mergedCart.find(i => i.productId === nappaCushion.id);
    assertEqual(mergedCushion.quantity, 1);

    // Persist merged cart to Firestore
    await db.setDoc('user_carts', activeUser.uid, {
      userId: activeUser.uid,
      items: mergedCart,
      updatedAt: new Date().toISOString(),
    });

    // -----------------------------------------------------------------------
    // Step 5: Post-Auth Route Verification & Cart Totals Recalculation
    // -----------------------------------------------------------------------
    const postAuthCheckoutCheck = checkAuthGuard(activeUser, '/checkout');
    assertEqual(postAuthCheckoutCheck.allowed, true, 'Authenticated customer must now be allowed to checkout');
    assertEqual(postAuthCheckoutCheck.redirectUrl, null);

    // Totals math on merged cart: (89 * 2) + 65 = 178 + 65 = 243.0
    const totals = calculateCartTotals(mergedCart);
    assertEqual(totals.subtotal, 243.0);
    assertEqual(totals.shipping, 0.0); // > $100 threshold
    assertEqual(totals.tax, 19.44); // 8% of 243
    assertEqual(totals.totalAmount, 262.44);
    assertEqual(totals.itemCount, 3);

    // -----------------------------------------------------------------------
    // Step 6: Session Logout & Fresh Client Re-hydration
    // -----------------------------------------------------------------------
    // Logout
    activeUser = null;
    const rehydratedWishlist = new WishlistManager();
    let rehydratedCart = [];

    // Re-login as customer
    activeUser = mockUserSessions.customerUser;

    // Load from database
    const savedWishlist = await db.getDoc('user_wishlists', activeUser.uid);
    savedWishlist.items.forEach(id => rehydratedWishlist.addItem(id));

    const savedCart = await db.getDoc('user_carts', activeUser.uid);
    rehydratedCart = savedCart.items;

    // Verify re-hydrated state matches merged state
    assertEqual(rehydratedWishlist.getCount(), 2);
    assert(rehydratedWishlist.hasItem('prod-single-bmw-lip'));
    assert(rehydratedWishlist.hasItem('prod-multi-german-led'));

    assertEqual(rehydratedCart.length, 2);
    assertEqual(rehydratedCart.find(i => i.productId === ceramicKit.id).quantity, 2);
    assertEqual(rehydratedCart.find(i => i.productId === nappaCushion.id).quantity, 1);
  });
});
