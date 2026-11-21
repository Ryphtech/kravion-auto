/**
 * Tier 2 Boundary Test: B7 - WhatsApp Hand-off Encoding & Special Character Boundaries
 * Requirement: ORIGINAL_REQUEST.md §R2 & PROJECT.md § Feature 20, 22
 * Boundaries: International phone numbers ('+', '00', spaces, dashes, brackets),
 * complex customer names/addresses with emojis, ampersands, newlines, quotation marks,
 * extremely long order lists, missing optional fields, fallback phone numbers.
 */

import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertMatch,
  assertIncludes,
  assertGreaterThan,
} from '../helpers/assertions.mjs';
import { mockOrders } from '../helpers/mock-data.mjs';
import { formatWhatsAppUrl, ENV_CONFIG } from '../helpers/test-env.mjs';

describe('Tier 2: B7 - WhatsApp Hand-off Encoding & Special Character Boundaries', () => {
  const baseOrder = mockOrders[0];

  test('B7.1: international phone numbers with "+", "00", spaces, hyphens, and parentheses sanitize strictly to digits', () => {
    const internationalNumbers = [
      { raw: '+44 20 7946 0912', expectedDigits: '442079460912' },
      { raw: '0091-98765-43210', expectedDigits: '00919876543210' },
      { raw: '+1 (800) 555-0199', expectedDigits: '18005550199' },
      { raw: '+49.30.1234567', expectedDigits: '49301234567' },
      { raw: '  +81 90 1234 5678  ', expectedDigits: '819012345678' },
    ];

    for (const { raw, expectedDigits } of internationalNumbers) {
      const url = formatWhatsAppUrl(baseOrder, raw);
      const urlObj = new URL(url);
      const phoneInPath = urlObj.pathname.replace(/^\//, '');
      assertEqual(phoneInPath, expectedDigits, `Raw phone "${raw}" should sanitize to digits "${expectedDigits}"`);
      assertMatch(phoneInPath, /^\d+$/, 'Phone path must consist only of decimal digits');
    }
  });

  test('B7.2: customer name and address with emojis, ampersands, newlines, and quotation marks encode safely without URL corruption', () => {
    const complexOrder = {
      ...baseOrder,
      customerName: 'Dr. René "Speedy" O\'Connor & Sons 🏎️⚡',
      shippingAddress: {
        street: 'Apt 4B "Penthouse"\nLine 2 & 3: Oak Avenue',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01310-100',
        country: 'Brazil & Mercosur',
      },
      notes: 'Please double-box! <Fragile> & "No Friday delivery" 📦',
    };

    const url = formatWhatsAppUrl(complexOrder, '919876543210');

    // 1. Verify URL is structurally valid and parseable by standard URL parser
    const parsedUrl = new URL(url);
    assertEqual(parsedUrl.protocol, 'https:');
    assertEqual(parsedUrl.hostname, 'wa.me');

    // 2. Verify raw URL string contains no unescaped whitespaces or raw newlines
    assert(!url.includes('\n'), 'Raw URL must never contain unescaped newline characters');
    assert(!url.includes(' '), 'Raw URL must never contain literal spaces');

    // 3. Verify decoded message accurately recovers all complex characters intact
    const textParam = parsedUrl.searchParams.get('text');
    assertIncludes(textParam, 'Dr. René "Speedy" O\'Connor & Sons 🏎️⚡');
    assertIncludes(textParam, 'Apt 4B "Penthouse"\nLine 2 & 3: Oak Avenue');
    assertIncludes(textParam, 'São Paulo');
    assertIncludes(textParam, 'Brazil & Mercosur');
    assertIncludes(textParam, 'Please double-box! <Fragile> & "No Friday delivery" 📦');
  });

  test('B7.3: extremely long order list (50 distinct line items) produces valid URL and preserves all items', () => {
    const items = [];
    for (let i = 1; i <= 50; i++) {
      items.push({
        productId: `bulk-part-${i}`,
        title: `Titanium Hardware Lug Bolt Grade 5 Spec-${i}`,
        quantity: 4,
        price: 12.50,
        subtotal: 50.00,
      });
    }

    const hugeOrder = {
      ...baseOrder,
      orderNumber: 'KRAV-MASSIVE-50',
      items,
      subtotal: 2500.00,
      tax: 200.00,
      shipping: 0.00,
      totalAmount: 2700.00,
    };

    const url = formatWhatsAppUrl(hugeOrder, '919876543210');

    // Verify it is a valid URL
    const parsed = new URL(url);
    const decoded = parsed.searchParams.get('text');

    assertGreaterThan(url.length, 2000, 'URL should accommodate long order itemization');
    assertIncludes(decoded, 'KRAV-MASSIVE-50');
    assertIncludes(decoded, 'Titanium Hardware Lug Bolt Grade 5 Spec-1 (x4) - $50.00');
    assertIncludes(decoded, 'Titanium Hardware Lug Bolt Grade 5 Spec-50 (x4) - $50.00');
    assertIncludes(decoded, 'Total Amount: $2700.00');
  });

  test('B7.4: missing optional fields (customer email, notes, vehicle) are gracefully handled without "undefined" output', () => {
    const minimalOrder = {
      orderNumber: 'KRAV-MINIMAL-01',
      customerName: 'Marcus Vance',
      customerPhone: '+1-555-0101',
      customerEmail: undefined, // Missing email
      shippingAddress: undefined, // Missing address
      vehicleDetails: undefined, // Missing vehicle
      items: [
        {
          productId: 'p-1',
          title: 'Aero Decal',
          price: 15.00,
          quantity: 1,
          subtotal: 15.00,
        },
      ],
      subtotal: 15.00,
      tax: 1.20,
      shipping: 15.00,
      totalAmount: 31.20,
      notes: undefined, // Missing notes
    };

    const url = formatWhatsAppUrl(minimalOrder, '919876543210');
    const parsed = new URL(url);
    const decoded = parsed.searchParams.get('text');

    assert(!decoded.includes('undefined'), 'Message body must not contain literal "undefined" string');
    assertIncludes(decoded, 'Customer Details:');
    assertIncludes(decoded, 'Email: N/A');
    assert(!decoded.includes('Customer Notes:'), 'Should omit Customer Notes when empty');
    assertIncludes(decoded, '*Total Amount: $31.20*');
  });

  test('B7.5: empty or missing recipient phone number defaults safely to ENV default WhatsApp number', () => {
    // When recipientPhone is empty string, null, or undefined, formatWhatsAppUrl uses default
    const falsyPhones = ['', null, undefined];

    for (const p of falsyPhones) {
      const url = formatWhatsAppUrl(baseOrder, p);
      const parsed = new URL(url);
      const recipient = parsed.pathname.replace(/^\//, '');
      assertEqual(
        recipient,
        ENV_CONFIG.defaultWhatsAppNumber,
        `Falsy phone "${p}" must fall back to default ${ENV_CONFIG.defaultWhatsAppNumber}`
      );
    }

    // Whitespace string when sanitized / trimmed before format falls back to default
    const whitespacePhone = '   ';
    const effectivePhone = whitespacePhone.trim() || ENV_CONFIG.defaultWhatsAppNumber;
    const urlWs = formatWhatsAppUrl(baseOrder, effectivePhone);
    const parsedWs = new URL(urlWs);
    assertEqual(parsedWs.pathname.replace(/^\//, ''), ENV_CONFIG.defaultWhatsAppNumber);
  });
});
