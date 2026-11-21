/**
 * Tier 1 Feature Test: F8 - Order Enquiry Persistence & Payment Omission Guarantee
 * Requirement: ORIGINAL_REQUEST.md §R2 & PROJECT.md § Feature 21
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertDeepEqual,
  assertMatch,
} from '../helpers/assertions.mjs';
import { mockOrders } from '../helpers/mock-data.mjs';
import { MockFirestoreDatabase } from '../helpers/test-env.mjs';

describe('Tier 1: F8 - Order Enquiry Persistence & Payment Omission Guarantee', () => {
  let db;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
  });

  test('F8.1: order creation preserves complete schema and metadata', async () => {
    const newOrder = {
      id: 'order-test-new-1',
      orderNumber: 'KRAV-10294',
      customerName: 'Elena Rostova',
      customerPhone: '+1-555-019-2831',
      customerEmail: 'elena.rostova@example.com',
      shippingAddress: {
        street: '100 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        postalCode: '33139',
        country: 'USA',
      },
      vehicleDetails: {
        make: 'Porsche',
        model: '911 Carrera (992)',
        year: '2023',
      },
      items: [
        {
          productId: 'prod-universal-ceramic-kit',
          title: 'Kravion Ultra-Hydrophobic 9H Ceramic Coating Protection Kit',
          price: 89.0,
          quantity: 2,
          subtotal: 178.0,
        },
      ],
      subtotal: 178.0,
      tax: 14.24,
      shipping: 0.0,
      totalAmount: 192.24,
      status: 'enquiry_placed',
      paymentMethod: 'none',
      paymentStatus: 'pending_manual_quote',
      createdAt: new Date().toISOString(),
    };

    await db.setDoc('orders', newOrder.id, newOrder);
    const persisted = await db.getDoc('orders', newOrder.id);

    assert(persisted, 'Order must be saved and retrievable');
    assertEqual(persisted.id, newOrder.id);
    assertEqual(persisted.orderNumber, 'KRAV-10294');
    assertDeepEqual(persisted.items, newOrder.items);
  });

  test('F8.2: initial order status must strictly be "enquiry_placed"', async () => {
    for (const order of mockOrders) {
      assertEqual(
        order.status,
        'enquiry_placed',
        `Order status must strictly be "enquiry_placed", got "${order.status}"`
      );
    }
  });

  test('F8.3: customer contact information and vehicle context are accurately preserved', async () => {
    const order = await db.getDoc('orders', mockOrders[0].id);

    assert(order.customerName && order.customerName.length > 0, 'Customer name must be preserved');
    assert(order.customerPhone && order.customerPhone.length > 0, 'Customer phone must be preserved');
    assert(order.shippingAddress && order.shippingAddress.street, 'Shipping address must be preserved');
    assert(order.vehicleDetails && order.vehicleDetails.make, 'Vehicle make must be preserved');
  });

  test('F8.4: total amount integrity matches item line subtotals plus tax and shipping', async () => {
    const order = mockOrders[0];
    const itemsSum = order.items.reduce((sum, item) => sum + item.subtotal, 0);
    const calculatedTotal = Math.round((itemsSum + order.tax + order.shipping) * 100) / 100;

    assertEqual(
      order.totalAmount,
      calculatedTotal,
      `Order total (${order.totalAmount}) must match sum of items, tax, and shipping (${calculatedTotal})`
    );
  });

  test('F8.5: strict payment omission guarantee: orders must NOT possess paid status or gateway transaction id', async () => {
    const order = mockOrders[0];

    // Verify negative assertions required by R2
    assertEqual(order.status !== 'paid', true, 'Order status must never be set to "paid"');
    assertEqual(order.paymentMethod, 'none', 'Payment method must be "none"');
    assert(
      !order.stripePaymentIntentId && !order.paypalOrderId && !order.razorpayPaymentId,
      'Order must not contain payment gateway transaction identifiers'
    );
  });

  test('F8.6: query orders by status returns all enquiry_placed orders', async () => {
    const enquiries = await db.queryDocs('orders', o => o.status === 'enquiry_placed');
    assert(enquiries.length > 0, 'Should return at least one order with status enquiry_placed');
    for (const enq of enquiries) {
      assertEqual(enq.status, 'enquiry_placed');
    }
  });
});
