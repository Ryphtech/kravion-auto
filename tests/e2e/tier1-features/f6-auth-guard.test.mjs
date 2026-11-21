/**
 * Tier 1 Feature Test: F6 - Customer Authentication & Pre-Checkout Guard
 * Requirement: ORIGINAL_REQUEST.md §R2 & PROJECT.md § Feature 16, 19
 */

import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertMatch,
  assertIncludes,
} from '../helpers/assertions.mjs';
import { mockUserSessions } from '../helpers/mock-data.mjs';
import { checkAuthGuard } from '../helpers/test-env.mjs';

describe('Tier 1: F6 - Customer Authentication & Pre-Checkout Guard', () => {
  const { guestUser, customerUser, googleUser, adminUser } = mockUserSessions;

  test('F6.1: unauthenticated guest accessing checkout is blocked and redirected to login', () => {
    const result = checkAuthGuard(guestUser, '/checkout');
    assertEqual(result.allowed, false);
    assertEqual(result.reason, 'unauthenticated');
    assertIncludes(result.redirectUrl, '/login');
    assertIncludes(result.redirectUrl, encodeURIComponent('/checkout'));
  });

  test('F6.2: authenticated customer is permitted to access checkout', () => {
    const result = checkAuthGuard(customerUser, '/checkout');
    assertEqual(result.allowed, true);
    assertEqual(result.redirectUrl, null);
  });

  test('F6.3: email/password customer session validation', () => {
    assert(customerUser.uid, 'User must have a UID');
    assertEqual(customerUser.providerId, 'password');
    assertIncludes(customerUser.email, '@');
    assert(customerUser.token && customerUser.token.length > 10, 'Session must have valid auth token');
  });

  test('F6.4: Google Sign-In customer session validation', () => {
    assert(googleUser.uid, 'Google user must have UID');
    assertEqual(googleUser.providerId, 'google.com');
    assertIncludes(googleUser.email, '@');
    assert(googleUser.displayName, 'Google user must have display name');

    const result = checkAuthGuard(googleUser, '/checkout');
    assertEqual(result.allowed, true);
  });

  test('F6.5: role-based access control blocks standard customer from admin routes', () => {
    const customerAccess = checkAuthGuard(customerUser, '/admin/products');
    assertEqual(customerAccess.allowed, false);
    assertEqual(customerAccess.reason, 'forbidden_non_admin');
    assertEqual(customerAccess.redirectUrl, '/unauthorized');

    const adminAccess = checkAuthGuard(adminUser, '/admin/products');
    assertEqual(adminAccess.allowed, true);
    assertEqual(adminAccess.redirectUrl, null);
  });

  test('F6.6: public storefront routes are accessible to all users including unauthenticated guests', () => {
    const publicRoutes = ['/', '/products', '/products/prod-1', '/about', '/contact'];
    for (const route of publicRoutes) {
      const result = checkAuthGuard(guestUser, route);
      assertEqual(result.allowed, true, `Guest should be allowed to view ${route}`);
      assertEqual(result.redirectUrl, null);
    }
  });
});
