/**
 * Comprehensive assertion utilities for Kravion Auto E2E Test Suite.
 */

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

/**
 * Asserts that condition evaluates to truthy.
 */
export function assert(condition, message = 'Assertion failed: expected value to be truthy') {
  if (!condition) {
    throw new AssertionError(message, condition, true);
  }
}

/**
 * Asserts strict equality (===) between actual and expected.
 */
export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    const defaultMsg = `Expected ${JSON.stringify(actual)} to strictly equal ${JSON.stringify(expected)}`;
    throw new AssertionError(message || defaultMsg, actual, expected);
  }
}

/**
 * Asserts deep structural equality between actual and expected.
 */
export function assertDeepEqual(actual, expected, message) {
  const isDeepEqual = (a, b) => {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!isDeepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
        if (!isDeepEqual(a[key], b[key])) return false;
      }
      return true;
    }

    return false;
  };

  if (!isDeepEqual(actual, expected)) {
    const defaultMsg = `Deep equality mismatch:\nActual:   ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`;
    throw new AssertionError(message || defaultMsg, actual, expected);
  }
}

/**
 * Asserts that a function throws an error, optionally matching error message or regex.
 */
export async function assertThrows(fn, expectedErrorOrRegex, message) {
  let threw = false;
  let caughtError = null;

  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      await res;
    }
  } catch (err) {
    threw = true;
    caughtError = err;
  }

  if (!threw) {
    throw new AssertionError(
      message || 'Expected function to throw an error, but it returned successfully.',
      null,
      'Error thrown'
    );
  }

  if (expectedErrorOrRegex) {
    if (expectedErrorOrRegex instanceof RegExp) {
      if (!expectedErrorOrRegex.test(caughtError.message)) {
        throw new AssertionError(
          message || `Expected error message to match ${expectedErrorOrRegex}, got "${caughtError.message}"`,
          caughtError.message,
          expectedErrorOrRegex.toString()
        );
      }
    } else if (typeof expectedErrorOrRegex === 'string') {
      if (!caughtError.message.includes(expectedErrorOrRegex)) {
        throw new AssertionError(
          message || `Expected error message to include "${expectedErrorOrRegex}", got "${caughtError.message}"`,
          caughtError.message,
          expectedErrorOrRegex
        );
      }
    } else if (typeof expectedErrorOrRegex === 'function') {
      if (!(caughtError instanceof expectedErrorOrRegex)) {
        throw new AssertionError(
          message || `Expected error to be instance of ${expectedErrorOrRegex.name}, got ${caughtError.constructor.name}`,
          caughtError.constructor.name,
          expectedErrorOrRegex.name
        );
      }
    }
  }
}

/**
 * Asserts that string contains substring or array contains item / predicate match.
 */
export function assertIncludes(actual, target, message) {
  if (typeof actual === 'string') {
    if (!actual.includes(target)) {
      throw new AssertionError(
        message || `Expected string to include "${target}", got "${actual}"`,
        actual,
        target
      );
    }
    return;
  }

  if (Array.isArray(actual)) {
    if (typeof target === 'function') {
      const match = actual.some(target);
      if (!match) {
        throw new AssertionError(
          message || 'Expected array to contain item matching predicate',
          actual,
          'predicate match'
        );
      }
    } else {
      if (!actual.includes(target)) {
        throw new AssertionError(
          message || `Expected array to include ${JSON.stringify(target)}`,
          actual,
          target
        );
      }
    }
    return;
  }

  throw new AssertionError('assertIncludes target must be a string or array', actual, target);
}

/**
 * Asserts that a string matches a RegExp.
 */
export function assertMatch(actual, regex, message) {
  if (typeof actual !== 'string') {
    throw new AssertionError(`Expected string input for assertMatch, got ${typeof actual}`, actual, regex);
  }
  if (!regex.test(actual)) {
    throw new AssertionError(
      message || `Expected "${actual}" to match pattern ${regex}`,
      actual,
      regex.toString()
    );
  }
}

/**
 * Asserts that actual is strictly greater than boundary.
 */
export function assertGreaterThan(actual, boundary, message) {
  if (typeof actual !== 'number' || typeof boundary !== 'number') {
    throw new AssertionError('Both actual and boundary must be numbers for assertGreaterThan', actual, boundary);
  }
  if (actual <= boundary) {
    throw new AssertionError(
      message || `Expected ${actual} to be strictly greater than ${boundary}`,
      actual,
      `> ${boundary}`
    );
  }
}

/**
 * Asserts that actual is strictly less than boundary.
 */
export function assertLessThan(actual, boundary, message) {
  if (typeof actual !== 'number' || typeof boundary !== 'number') {
    throw new AssertionError('Both actual and boundary must be numbers for assertLessThan', actual, boundary);
  }
  if (actual >= boundary) {
    throw new AssertionError(
      message || `Expected ${actual} to be strictly less than ${boundary}`,
      actual,
      `< ${boundary}`
    );
  }
}
