/**
 * Tier 1 Feature Test: F7 - WhatsApp Hand-Off URL Formatter & Disclaimer
 * Requirement: ORIGINAL_REQUEST.md §R2 & PROJECT.md § WhatsApp Order Hand-off Contract
 */

import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertMatch,
  assertIncludes,
} from '../helpers/assertions.mjs';
import { mockOrders } from '../helpers/mock-data.mjs';
import { formatWhatsAppUrl } from '../helpers/test-env.mjs';

describe('Tier 1: F7 - WhatsApp Hand-Off URL Formatter & Disclaimer', () => {
  const sampleOrder = mockOrders[0];

  test('F7.1: generated WhatsApp URL must strictly conform to https://wa.me/ schema', () => {
    const url = formatWhatsAppUrl(sampleOrder, '919876543210');

    assert(url.startsWith('https://wa.me/'), `URL must start with https://wa.me/, got "${url}"`);
    assertMatch(url, /^https:\/\/wa\.me\/\d+\?text=.+/);
  });

  test('F7.2: recipient phone number must be thoroughly sanitized of spaces, symbols, and formatting', () => {
    const messyNumbers = [
      { raw: '+91 98765 43210', expected: '919876543210' },
      { raw: '+1 (555) 234-5678', expected: '15552345678' },
      { raw: '91-98765-43210', expected: '919876543210' },
      { raw: ' +44 (0) 20 7946 0912 ', expected: '4402079460912' },
    ];

    for (const { raw, expected } of messyNumbers) {
      const url = formatWhatsAppUrl(sampleOrder, raw);
      const urlObj = new URL(url);
      const cleanPhone = urlObj.pathname.replace('/', '');
      assertEqual(cleanPhone, expected, `Phone number ${raw} must sanitize to ${expected}`);
    }
  });

  test('F7.3: message body must be safely URL-encoded', () => {
    const url = formatWhatsAppUrl(sampleOrder, '919876543210');
    const urlObj = new URL(url);
    const textParam = urlObj.searchParams.get('text');

    assert(textParam, 'URL must include non-empty text parameter');
    // Ensure raw unencoded newlines or illegal URL characters are not in raw string
    const rawQuery = url.split('?text=')[1];
    assert(!rawQuery.includes('\n'), 'Raw URL must not contain literal newlines');
    assert(!rawQuery.includes(' '), 'Raw URL must not contain literal spaces');
  });

  test('F7.4: message must contain itemized order details including titles, quantities, and prices', () => {
    const url = formatWhatsAppUrl(sampleOrder, '919876543210');
    const decodedMessage = decodeURIComponent(url.split('?text=')[1]);

    for (const item of sampleOrder.items) {
      assertIncludes(decodedMessage, item.title, 'Message must contain item title');
      assertIncludes(decodedMessage, `x${item.quantity}`, 'Message must contain item quantity');
      assertIncludes(decodedMessage, `$${item.price.toFixed(2)}`, 'Message must contain item unit price');
    }
    assertIncludes(decodedMessage, `$${sampleOrder.totalAmount.toFixed(2)}`, 'Message must contain total amount');
  });

  test('F7.5: message must contain explicit disclaimer that online payment is not collected on website', () => {
    const url = formatWhatsAppUrl(sampleOrder, '919876543210');
    const decodedMessage = decodeURIComponent(url.split('?text=')[1]);

    assertMatch(
      decodedMessage,
      /online payment is not collected/i,
      'Message must state that online payment is not collected on the website'
    );
    assertMatch(
      decodedMessage,
      /payment confirmation/i,
      'Message must mention payment confirmation via chat'
    );
  });

  test('F7.6: message must include formatted order reference code (KRAV-)', () => {
    const url = formatWhatsAppUrl(sampleOrder, '919876543210');
    const decodedMessage = decodeURIComponent(url.split('?text=')[1]);

    assertMatch(decodedMessage, /Reference:\s*KRAV-\d+/i, 'Message must include reference ID matching KRAV-');
    assertIncludes(decodedMessage, sampleOrder.orderNumber);
  });
});
