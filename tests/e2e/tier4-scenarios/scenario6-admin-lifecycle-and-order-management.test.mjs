/**
 * Tier 4 - Scenario 6: Admin Order Enquiry Lifecycle & Store Configuration Update
 * Specification: TEST_INFRA.md § Real-World Application Scenarios (Scenario 6)
 * Features Exercised: F7, F8, F9, F11
 *
 * Flow:
 * 1. Customer submits a detailed order enquiry:
 *    - Captures order number (KRAV-9801), items, vehicle context (BMW 3 Series), customer phone,
 *      and customer fitment notes. Initial status: "enquiry_placed".
 * 2. Admin logs in and inspects order enquiry in Admin Dashboard (/admin/orders):
 *    - Validates order record integrity, item subtotals, tax, and notes.
 * 3. Admin generates one-click WhatsApp concierge reply link:
 *    - Targets customer's phone number directly with pre-filled fitment confirmation and quote.
 *    - Admin transitions order status from "enquiry_placed" to "contacted".
 * 4. Admin updates Store Settings (/admin/settings):
 *    - Modifies WhatsApp recipient phone from default (+91 98765 43210) to a new US support number (+1 650 555-0199).
 *    - Updates free shipping threshold from $100 to $150.
 *    - Persists settings to Firestore.
 * 5. Subsequent Customer Checkout Verification:
 *    - A new customer checks out an order.
 *    - Verifies checkout engine immediately uses the new store phone (16505550199) and updated threshold.
 *    - Verifies old phone number is completely superseded.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertMatch,
  assertIncludes,
  assertGreaterThan,
} from '../helpers/assertions.mjs';
import {
  mockOrders,
  mockUserSessions,
  mockProducts,
} from '../helpers/mock-data.mjs';
import {
  MockFirestoreDatabase,
  ResilientDataService,
  formatWhatsAppUrl,
  calculateCartTotals,
  checkAuthGuard,
} from '../helpers/test-env.mjs';

describe('Tier 4: Scenario 6 - Admin Order Enquiry Lifecycle & Store Configuration Update', () => {
  let db;
  let dataService;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
    dataService = new ResilientDataService(db);
  });

  test('admin reviews enquiry, contacts customer on WhatsApp, updates store phone, and verifies subsequent checkout uses new phone', async () => {
    // -----------------------------------------------------------------------
    // Step 1: Customer Submits Order Enquiry
    // -----------------------------------------------------------------------
    const initialOrder = mockOrders[0];
    assertEqual(initialOrder.status, 'enquiry_placed');
    assertEqual(initialOrder.paymentMethod, 'none');

    await db.setDoc('orders', initialOrder.id, initialOrder);

    // -----------------------------------------------------------------------
    // Step 2: Admin Logs in & Inspects Order Enquiry in Dashboard
    // -----------------------------------------------------------------------
    const adminSession = mockUserSessions.adminUser;
    const adminAccess = checkAuthGuard(adminSession, '/admin/orders');
    assertEqual(adminAccess.allowed, true, 'Admin user must have access to admin orders dashboard');

    // Admin queries pending orders
    const ordersList = await db.queryDocs('orders', o => o.status === 'enquiry_placed');
    assertGreaterThan(ordersList.length, 0);

    const pendingOrder = ordersList.find(o => o.id === initialOrder.id);
    assert(pendingOrder, 'Admin must locate customer order in enquiries list');
    assertEqual(pendingOrder.customerName, 'Marcus Vance');
    assertEqual(pendingOrder.customerPhone, '+1 (555) 234-5678');
    assertEqual(pendingOrder.vehicleDetails.make, 'BMW');
    assertIncludes(pendingOrder.notes, 'packaging is reinforced');

    // -----------------------------------------------------------------------
    // Step 3: Admin Generates Concierge WhatsApp Reply Link & Updates Status
    // -----------------------------------------------------------------------
    // Concierge reply URL builder: contacts customer on their phone
    function generateAdminConciergeReplyUrl(order) {
      const cleanCustomerPhone = String(order.customerPhone).replace(/[^\d]/g, '');
      const messageLines = [
        `*Kravion Auto Concierge Support*`,
        `Hello ${order.customerName},`,
        `Regarding your order enquiry #${order.orderNumber} for your ${order.vehicleDetails.make} ${order.vehicleDetails.model}:`,
        `We have verified fitment for all requested items. Total amount is $${Number(order.totalAmount).toFixed(2)}.`,
        `Notes recorded: "${order.notes || 'None'}"`,
        ``,
        `Please let us know if you would like us to issue the official pro-forma invoice and proceed with dispatch.`
      ];
      return `https://wa.me/${cleanCustomerPhone}?text=${encodeURIComponent(messageLines.join('\n'))}`;
    }

    const conciergeUrl = generateAdminConciergeReplyUrl(pendingOrder);
    assertMatch(conciergeUrl, /^https:\/\/wa\.me\/15552345678\?text=.+/);

    const decodedConciergeMsg = decodeURIComponent(conciergeUrl);
    assertIncludes(decodedConciergeMsg, 'Marcus Vance');
    assertIncludes(decodedConciergeMsg, 'KRAV-9801');
    assertIncludes(decodedConciergeMsg, 'verified fitment for all requested items');

    // Admin updates order status to 'contacted'
    await db.updateDoc('orders', pendingOrder.id, {
      status: 'contacted',
      adminNotes: 'Customer contacted via WhatsApp concierge on 2026-11-20.',
    });

    const updatedOrder = await db.getDoc('orders', pendingOrder.id);
    assertEqual(updatedOrder.status, 'contacted');
    assertEqual(updatedOrder.adminNotes, 'Customer contacted via WhatsApp concierge on 2026-11-20.');

    // -----------------------------------------------------------------------
    // Step 4: Admin Updates Store Settings (WhatsApp Phone & Free Shipping Threshold)
    // -----------------------------------------------------------------------
    const currentSettings = await dataService.getSettings();
    assertEqual(currentSettings.whatsappNumber, '919876543210');
    assertEqual(currentSettings.freeShippingThreshold, 100.0);

    const newStorePhone = '+1 (650) 555-0199'; // Sanitizes to 16505550199
    const newShippingThreshold = 150.0;

    await db.updateDoc('settings', 'store', {
      whatsappNumber: newStorePhone,
      contactPhone: newStorePhone,
      freeShippingThreshold: newShippingThreshold,
    });

    // Verify settings updated in Firestore
    const refreshedSettings = await dataService.getSettings();
    assertEqual(refreshedSettings.whatsappNumber, newStorePhone);
    assertEqual(refreshedSettings.freeShippingThreshold, 150.0);

    // -----------------------------------------------------------------------
    // Step 5: Subsequent Customer Checkout Verification with New Settings
    // -----------------------------------------------------------------------
    // New customer adds $120 order (above old $100 threshold, but below new $150 threshold)
    const newCustomerCart = [
      { price: 120.0, quantity: 1, title: 'Porsche Sport Air Filter' },
    ];

    const newTotals = calculateCartTotals(newCustomerCart, {
      freeShippingThreshold: refreshedSettings.freeShippingThreshold,
      taxRatePercent: refreshedSettings.taxRatePercent,
      defaultShippingCost: refreshedSettings.defaultShippingCost,
    });

    // Subtotal $120 < new threshold $150 -> standard shipping $15 applied!
    assertEqual(newTotals.subtotal, 120.0);
    assertEqual(newTotals.shipping, 15.0); // Not free!
    assertEqual(newTotals.tax, 9.6); // 8% of 120
    assertEqual(newTotals.totalAmount, 144.6);

    const subsequentOrder = {
      id: 'order-scenario6-subsequent-01',
      orderNumber: 'KRAV-9902',
      customerName: 'Elena Rostova',
      customerPhone: '+1 (555) 678-9012',
      customerEmail: 'elena.rostova@example.com',
      shippingAddress: {
        street: '888 Brannan St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94103',
        country: 'United States',
      },
      vehicleDetails: {
        make: 'Porsche',
        model: '911 Carrera (992)',
        year: '2023',
      },
      items: newCustomerCart,
      subtotal: newTotals.subtotal,
      shipping: newTotals.shipping,
      tax: newTotals.tax,
      totalAmount: newTotals.totalAmount,
      status: 'enquiry_placed',
      paymentMethod: 'none',
      paymentStatus: 'pending_manual_quote',
      createdAt: new Date().toISOString(),
    };

    await db.setDoc('orders', subsequentOrder.id, subsequentOrder);

    // Format WhatsApp hand-off URL using newly configured store phone
    const checkoutWaUrl = formatWhatsAppUrl(subsequentOrder, refreshedSettings.whatsappNumber);

    // CRITICAL: URL must target new sanitized phone number 16505550199
    assert(
      checkoutWaUrl.startsWith('https://wa.me/16505550199'),
      `Checkout WhatsApp URL must use newly configured phone number, got ${checkoutWaUrl}`
    );
    assert(
      !checkoutWaUrl.includes('919876543210'),
      'Old WhatsApp recipient phone must not appear in generated URL'
    );

    const decodedCheckoutMsg = decodeURIComponent(checkoutWaUrl);
    assertIncludes(decodedCheckoutMsg, 'KRAV-9902');
    assertIncludes(decodedCheckoutMsg, 'Elena Rostova');
    assertIncludes(decodedCheckoutMsg, 'Shipping: $15.00');
    assertIncludes(decodedCheckoutMsg, 'Total Amount: $144.60');
    assertIncludes(decodedCheckoutMsg, 'Online payment is not collected on the website');
  });
});
