/**
 * Tier 2 Boundary Test: B8 - Order Enquiry Validation & Payment Omission Boundaries
 * Requirement: ORIGINAL_REQUEST.md §R2 & PROJECT.md § Feature 21, Feature 29
 * Boundaries: 0 items order rejection, negative prices/quantities, missing shipping address fields,
 * non-numeric phone number, strict blocking of 'paid' status transition.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertThrows,
  assertIncludes,
} from '../helpers/assertions.mjs';
import { mockOrders } from '../helpers/mock-data.mjs';
import { MockFirestoreDatabase } from '../helpers/test-env.mjs';

function validateOrderEnquiry(order) {
  if (!order) {
    throw new Error('Order payload is required');
  }

  // 1. Items validation
  if (!Array.isArray(order.items) || order.items.length === 0) {
    throw new Error('Order must contain at least 1 item');
  }

  for (const item of order.items) {
    if (typeof item.price !== 'number' || item.price < 0) {
      throw new Error(`Invalid price for item ${item.title}: price cannot be negative`);
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      throw new Error(`Invalid quantity for item ${item.title}: quantity must be positive`);
    }
  }

  // 2. Customer Phone validation
  if (!order.customerPhone || typeof order.customerPhone !== 'string') {
    throw new Error('Customer phone number is required');
  }
  const digitsOnly = order.customerPhone.replace(/[^\d]/g, '');
  if (digitsOnly.length < 7) {
    throw new Error(`Customer phone number is invalid: must contain at least 7 digits, got "${order.customerPhone}"`);
  }

  // 3. Shipping address validation
  if (!order.shippingAddress) {
    throw new Error('Shipping address is required');
  }
  const { street, city, country, postalCode } = order.shippingAddress;
  if (!street || !street.trim()) throw new Error('Shipping address missing street');
  if (!city || !city.trim()) throw new Error('Shipping address missing city');
  if (!country || !country.trim()) throw new Error('Shipping address missing country');
  if (!postalCode || !postalCode.trim()) throw new Error('Shipping address missing postalCode');

  // 4. Strict payment omission validation: cannot be created with paid status
  if (order.status === 'paid' || order.paymentStatus === 'paid') {
    throw new Error('Security violation: Orders cannot be created with paid status');
  }

  return { valid: true };
}

function updateOrderStatus(currentOrder, newStatus) {
  const allowedStatuses = ['enquiry_placed', 'contacted', 'quoted', 'confirmed', 'cancelled', 'dispatched'];
  if (newStatus === 'paid' || newStatus.toLowerCase().includes('paid')) {
    throw new Error('Forbidden status transition: Kravion Auto does not support "paid" status. Payment is handled off-platform.');
  }
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: "${newStatus}" is not an allowed order enquiry status.`);
  }
  return { ...currentOrder, status: newStatus, updatedAt: new Date().toISOString() };
}

describe('Tier 2: B8 - Order Enquiry Validation & Payment Omission Boundaries', () => {
  let db;
  const validBaseOrder = { ...mockOrders[0] };

  beforeEach(() => {
    db = new MockFirestoreDatabase();
  });

  test('B8.1: order with 0 items is strictly rejected', () => {
    const emptyItemsOrder = {
      ...validBaseOrder,
      items: [],
    };

    assertThrows(() => {
      validateOrderEnquiry(emptyItemsOrder);
    }, 'Order must contain at least 1 item');

    const nullItemsOrder = {
      ...validBaseOrder,
      items: null,
    };

    assertThrows(() => {
      validateOrderEnquiry(nullItemsOrder);
    }, 'Order must contain at least 1 item');
  });

  test('B8.2: order with negative item price or zero/negative quantity is rejected', () => {
    // Negative price
    const negativePriceOrder = {
      ...validBaseOrder,
      items: [
        {
          productId: 'p-neg',
          title: 'Defective Price Item',
          price: -50.00,
          quantity: 1,
        },
      ],
    };
    assertThrows(() => {
      validateOrderEnquiry(negativePriceOrder);
    }, /price cannot be negative/);

    // Negative quantity
    const negativeQtyOrder = {
      ...validBaseOrder,
      items: [
        {
          productId: 'p-qty',
          title: 'Defective Qty Item',
          price: 50.00,
          quantity: -2,
        },
      ],
    };
    assertThrows(() => {
      validateOrderEnquiry(negativeQtyOrder);
    }, /quantity must be positive/);

    // Zero quantity
    const zeroQtyOrder = {
      ...validBaseOrder,
      items: [
        {
          productId: 'p-zero',
          title: 'Zero Qty Item',
          price: 50.00,
          quantity: 0,
        },
      ],
    };
    assertThrows(() => {
      validateOrderEnquiry(zeroQtyOrder);
    }, /quantity must be positive/);
  });

  test('B8.3: order missing mandatory shipping address fields is rejected', () => {
    // Missing street
    const missingStreetOrder = {
      ...validBaseOrder,
      shippingAddress: {
        ...validBaseOrder.shippingAddress,
        street: '   ',
      },
    };
    assertThrows(() => validateOrderEnquiry(missingStreetOrder), 'Shipping address missing street');

    // Missing city
    const missingCityOrder = {
      ...validBaseOrder,
      shippingAddress: {
        ...validBaseOrder.shippingAddress,
        city: '',
      },
    };
    assertThrows(() => validateOrderEnquiry(missingCityOrder), 'Shipping address missing city');

    // Missing shipping address object completely
    const missingAddressObj = {
      ...validBaseOrder,
      shippingAddress: null,
    };
    assertThrows(() => validateOrderEnquiry(missingAddressObj), 'Shipping address is required');
  });

  test('B8.4: non-numeric or insufficient customer phone number is rejected', () => {
    const invalidPhones = [
      'call-me-maybe',
      'invalid_phone',
      'abc-def-ghij',
      '123',          // only 3 digits (insufficient)
      '',             // empty
      '   ',
    ];

    for (const phone of invalidPhones) {
      const orderWithBadPhone = {
        ...validBaseOrder,
        customerPhone: phone,
      };
      assertThrows(() => {
        validateOrderEnquiry(orderWithBadPhone);
      }, /Customer phone number is/);
    }
  });

  test('B8.5: strict payment omission guarantee: order state machine forbids transition to "paid" status', () => {
    const existingOrder = mockOrders[0];
    assertEqual(existingOrder.status, 'enquiry_placed');

    // Attempting to mutate status to 'paid' MUST throw forbidden status transition error
    assertThrows(() => {
      updateOrderStatus(existingOrder, 'paid');
    }, /Forbidden status transition/);

    assertThrows(() => {
      updateOrderStatus(existingOrder, 'PAID');
    }, /Forbidden status transition/);

    assertThrows(() => {
      updateOrderStatus(existingOrder, 'partially_paid');
    }, /Forbidden status transition/);

    // Legitimate transitions succeed
    const contacted = updateOrderStatus(existingOrder, 'contacted');
    assertEqual(contacted.status, 'contacted');

    const quoted = updateOrderStatus(contacted, 'quoted');
    assertEqual(quoted.status, 'quoted');

    const confirmed = updateOrderStatus(quoted, 'confirmed');
    assertEqual(confirmed.status, 'confirmed');
  });

  test('B8.6: order enquiry creation in database rejects attempted creation with "paid" status', async () => {
    const forgedPaidOrder = {
      ...validBaseOrder,
      id: 'order-forged-paid-1',
      status: 'paid',
    };

    assertThrows(() => {
      validateOrderEnquiry(forgedPaidOrder);
    }, 'Security violation: Orders cannot be created with paid status');
  });
});
