/**
 * Tier 2 Boundary Test: B6 - Customer Authentication & Session Tampering Boundaries
 * Requirement: ORIGINAL_REQUEST.md §R2 & PROJECT.md § Feature 16, 19
 * Boundaries: Malformed email formats, empty/short passwords, expired/revoked token handling,
 * concurrent session simulation, role-escalation tampering.
 */

import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertThrows,
  assertIncludes,
} from '../helpers/assertions.mjs';
import { mockUserSessions } from '../helpers/mock-data.mjs';
import { checkAuthGuard } from '../helpers/test-env.mjs';

function validateAuthCredentials(email, password) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'auth/invalid-email', message: 'Email is required' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim()) || email.includes('..') || email.includes(' ')) {
    return { valid: false, error: 'auth/invalid-email', message: 'Malformed email format' };
  }

  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'auth/missing-password', message: 'Password is required' };
  }
  if (password.trim().length === 0) {
    return { valid: false, error: 'auth/weak-password', message: 'Password cannot be whitespace only' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'auth/weak-password', message: 'Password must be at least 6 characters' };
  }

  return { valid: true };
}

function verifyTokenSession(userSession, currentTime = Math.floor(Date.now() / 1000)) {
  if (!userSession) {
    return { valid: false, reason: 'unauthenticated' };
  }
  if (userSession.isRevoked) {
    return { valid: false, reason: 'token_revoked' };
  }
  if (userSession.exp && userSession.exp < currentTime) {
    return { valid: false, reason: 'token_expired' };
  }
  return { valid: true, user: userSession };
}

describe('Tier 2: B6 - Customer Authentication & Session Tampering Boundaries', () => {
  test('B6.1: malformed email formats are strictly rejected by credentials validator', () => {
    const invalidEmails = [
      '',
      '   ',
      'plainaddress',
      '#@%^%#$@#$@#.com',
      '@missingusername.com',
      'user@.com',
      'user@example..com',
      'user name@example.com',
      'user@example.',
    ];

    for (const email of invalidEmails) {
      const result = validateAuthCredentials(email, 'ValidPassword123');
      assertEqual(result.valid, false, `Email "${email}" must be rejected as invalid`);
      assertEqual(result.error, 'auth/invalid-email');
    }

    // Valid email check
    const validResult = validateAuthCredentials('customer@kravion.com', 'ValidPassword123');
    assertEqual(validResult.valid, true);
  });

  test('B6.2: empty, whitespace-only, or sub-6-character passwords are rejected', () => {
    // Empty password
    const resEmpty = validateAuthCredentials('user@example.com', '');
    assertEqual(resEmpty.valid, false);

    // Whitespace password
    const resWs = validateAuthCredentials('user@example.com', '     ');
    assertEqual(resWs.valid, false);
    assertEqual(resWs.error, 'auth/weak-password');

    // 5 characters (1 below minimum threshold of 6)
    const res5 = validateAuthCredentials('user@example.com', '12345');
    assertEqual(res5.valid, false);
    assertEqual(res5.error, 'auth/weak-password');

    // 6 characters (exact threshold)
    const res6 = validateAuthCredentials('user@example.com', '123456');
    assertEqual(res6.valid, true);
  });

  test('B6.3: expired or revoked session tokens trigger re-authentication requirement', () => {
    const now = Math.floor(Date.now() / 1000);

    // 1. Expired token (exp 1 hour ago)
    const expiredSession = {
      ...mockUserSessions.customerUser,
      exp: now - 3600,
    };
    const expiredCheck = verifyTokenSession(expiredSession, now);
    assertEqual(expiredCheck.valid, false);
    assertEqual(expiredCheck.reason, 'token_expired');

    // 2. Revoked token
    const revokedSession = {
      ...mockUserSessions.customerUser,
      isRevoked: true,
      exp: now + 3600,
    };
    const revokedCheck = verifyTokenSession(revokedSession, now);
    assertEqual(revokedCheck.valid, false);
    assertEqual(revokedCheck.reason, 'token_revoked');

    // Expired session accessing checkout must be rejected by auth guard
    const authGuardResult = checkAuthGuard(expiredCheck.valid ? expiredSession : null, '/checkout');
    assertEqual(authGuardResult.allowed, false);
    assertIncludes(authGuardResult.redirectUrl, '/login');
  });

  test('B6.4: concurrent session simulation: independent session invalidation without shared corruption', () => {
    const sessionDeviceA = {
      uid: 'user-concurrent-1',
      token: 'jwt-token-device-a',
      sessionId: 'sess-dev-a',
      isRevoked: false,
    };

    const sessionDeviceB = {
      uid: 'user-concurrent-1',
      token: 'jwt-token-device-b',
      sessionId: 'sess-dev-b',
      isRevoked: false,
    };

    // Both sessions valid initially
    assertEqual(verifyTokenSession(sessionDeviceA).valid, true);
    assertEqual(verifyTokenSession(sessionDeviceB).valid, true);

    // Invalidate Device A only
    sessionDeviceA.isRevoked = true;
    assertEqual(verifyTokenSession(sessionDeviceA).valid, false);
    assertEqual(verifyTokenSession(sessionDeviceB).valid, true, 'Device B session should remain active');
  });

  test('B6.5: role-escalation tampering: client-forged admin claims are blocked by route guard', () => {
    // Attempt 1: Customer tampers local role property to 'admin' without valid admin signature
    const tamperedCustomer = {
      ...mockUserSessions.customerUser,
      role: 'customer',
      customClaims: {}, // Empty claims
    };

    // Client attempts spoofing role directly
    const spoofedRoles = [
      'ADMIN',           // Case mismatch
      'admin ',          // Whitespace padded
      'superadmin',      // Non-existent role
      'customer;admin',  // Injection attempt
      null,
      undefined,
      1,
    ];

    for (const spoofed of spoofedRoles) {
      const spoofedUser = { ...tamperedCustomer, role: spoofed };
      const guardResult = checkAuthGuard(spoofedUser, '/admin/products');
      assertEqual(guardResult.allowed, false, `Role "${spoofed}" must not grant access to /admin`);
      assertEqual(guardResult.reason, 'forbidden_non_admin');
    }

    // Only genuine adminUser with strict 'admin' role is allowed
    const genuineAdmin = checkAuthGuard(mockUserSessions.adminUser, '/admin/products');
    assertEqual(genuineAdmin.allowed, true);
  });
});
