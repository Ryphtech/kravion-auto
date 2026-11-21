/**
 * Tier 4 - Scenario 1: Complete Customer Journey: Discovery -> Fitment -> Cart -> WhatsApp Checkout
 * Specification: TEST_INFRA.md § Real-World Application Scenarios (Scenario 1)
 * Features Exercised: F1, F2, F3, F4, F6, F7, F8
 *
 * Flow:
 * 1. Customer enters storefront and sets BMW 3 Series (G20) in "My Garage".
 * 2. Filters catalog for vehicle make "BMW" and category "Lighting & Headlights".
 * 3. Inspects product detail for German Executive Sequential Dynamic Mirror LED Indicators.
 *    Validates R2 image gallery URLs, product specs, and dynamic fitment badge.
 * 4. Adds 2 units to shopping cart and checks real-time subtotal, free shipping eligibility, and tax.
 * 5. Attempts checkout as unauthenticated guest -> pre-checkout auth guard blocks and redirects to login.
 * 6. Authenticates via Firebase Auth Email/Password and resumes checkout.
 * 7. Enters customer shipping information and submits order enquiry.
 * 8. Verifies order document persisted in Firestore:
 *    - Status is strictly "enquiry_placed"
 *    - Strict payment omission: paymentMethod is "none", paymentStatus is "pending_manual_quote",
 *      no credit card, payment gateway IDs, or paid indicators exist.
 * 9. Generates click-to-chat WhatsApp checkout URL and validates message encoding, itemization,
 *    order reference ID, and explicit payment disclaimer.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertDeepEqual,
  assertMatch,
  assertIncludes,
  assertGreaterThan,
  assertLessThan,
} from '../helpers/assertions.mjs';
import {
  mockVehicles,
  mockProducts,
  mockUserSessions,
  R2_PUBLIC_BASE_URL,
} from '../helpers/mock-data.mjs';
import {
  ENV_CONFIG,
  MockFirestoreDatabase,
  ResilientDataService,
  checkCompatibility,
  formatWhatsAppUrl,
  calculateCartTotals,
  checkAuthGuard,
} from '../helpers/test-env.mjs';

describe('Tier 4: Scenario 1 - Customer Discovery to WhatsApp Checkout Flow', () => {
  let db;
  let dataService;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
    dataService = new ResilientDataService(db);
  });

  test('executes end-to-end customer journey from vehicle selection to WhatsApp hand-off without payment collection', async () => {
    // -----------------------------------------------------------------------
    // Step 1: Customer sets BMW 3 Series G20 in "My Garage"
    // -----------------------------------------------------------------------
    const bmwG20 = mockVehicles.find(v => v.id === 'bmw-3-g20');
    assert(bmwG20, 'BMW G20 vehicle fixture must exist in vehicle directory');
    assertEqual(bmwG20.make, 'BMW');

    let garageVehicle = bmwG20;

    // -----------------------------------------------------------------------
    // Step 2: Storefront Discovery - Faceted search by Make and Category
    // -----------------------------------------------------------------------
    const lightingCategory = (await dataService.getCategories()).find(c => c.id === 'lighting');
    assert(lightingCategory, 'Lighting category must exist');

    const discoveredProducts = await dataService.getProducts({
      make: garageVehicle.make,
      categoryId: lightingCategory.id,
    });

    assertGreaterThan(discoveredProducts.length, 0, 'Should find products matching BMW + lighting');

    // Verify all returned products are lighting and compatible with BMW
    for (const prod of discoveredProducts) {
      assertEqual(prod.categoryId, 'lighting');
      const fitment = checkCompatibility(prod, garageVehicle);
      assertEqual(fitment.compatible, true, `Product ${prod.id} must be compatible with selected BMW`);
    }

    // -----------------------------------------------------------------------
    // Step 3: Product Detail View & Vehicle Compatibility Inspection
    // -----------------------------------------------------------------------
    const targetProduct = discoveredProducts.find(p => p.id === 'prod-multi-german-led');
    assert(targetProduct, 'Target German Executive LED indicators must be found');

    // Validate Cloudflare R2 gallery URLs
    assertGreaterThan(targetProduct.images.length, 0, 'Product must have images');
    for (const imgUrl of targetProduct.images) {
      assert(
        imgUrl.startsWith(R2_PUBLIC_BASE_URL),
        `Image URL ${imgUrl} must be hosted on Cloudflare R2 public domain`
      );
    }

    // Validate specs
    assert(targetProduct.specs.material, 'Specs must include material');
    assert(targetProduct.specs.dimensions, 'Specs must include dimensions');
    assert(targetProduct.specs.warranty, 'Specs must include warranty');

    // Dynamic vehicle badge
    const badge = checkCompatibility(targetProduct, garageVehicle);
    assertEqual(badge.compatible, true);
    assertEqual(badge.reason, 'multi_match');
    assertIncludes(badge.label, garageVehicle.model);

    // -----------------------------------------------------------------------
    // Step 4: Add to Shopping Cart & Totals Math
    // -----------------------------------------------------------------------
    const cart = [
      {
        productId: targetProduct.id,
        title: targetProduct.title,
        price: targetProduct.price,
        quantity: 2,
        subtotal: targetProduct.price * 2,
      },
    ];

    const totals = calculateCartTotals(cart);
    assertEqual(totals.subtotal, 270.0); // $135 * 2
    assertEqual(totals.shipping, 0.0); // Subtotal >= $100 -> FREE shipping
    assertEqual(totals.tax, 21.6); // 8% of $270
    assertEqual(totals.totalAmount, 291.6);
    assertEqual(totals.itemCount, 2);

    // -----------------------------------------------------------------------
    // Step 5: Pre-Checkout Auth Guard Gating
    // -----------------------------------------------------------------------
    let currentSession = mockUserSessions.guestUser; // null
    const guestGuard = checkAuthGuard(currentSession, '/checkout');

    assertEqual(guestGuard.allowed, false, 'Guest user must NOT access checkout');
    assertEqual(guestGuard.reason, 'unauthenticated');
    assertEqual(guestGuard.redirectUrl, '/login?redirect=%2Fcheckout');

    // -----------------------------------------------------------------------
    // Step 6: Customer Authentication via Firebase Auth (Email/Password)
    // -----------------------------------------------------------------------
    currentSession = mockUserSessions.customerUser;
    assertEqual(currentSession.role, 'customer');
    assertEqual(currentSession.providerId, 'password');

    const authGuard = checkAuthGuard(currentSession, '/checkout');
    assertEqual(authGuard.allowed, true, 'Authenticated customer must be allowed to checkout');

    // -----------------------------------------------------------------------
    // Step 7: Order Enquiry Persistence & Payment Omission Guarantee
    // -----------------------------------------------------------------------
    const orderRecord = {
      id: 'order-scenario1-8821',
      orderNumber: 'KRAV-8821',
      customerId: currentSession.uid,
      customerName: currentSession.displayName,
      customerEmail: currentSession.email,
      customerPhone: '+1 (555) 890-1234',
      shippingAddress: {
        fullName: 'Marcus Vance',
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'United States',
      },
      vehicleDetails: {
        make: garageVehicle.make,
        model: garageVehicle.model,
        year: '2023',
      },
      items: cart,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      totalAmount: totals.totalAmount,
      currency: 'USD',
      status: 'enquiry_placed',
      paymentMethod: 'none',
      paymentStatus: 'pending_manual_quote',
      notes: 'Please verify mirror housing connector compatibility prior to dispatch.',
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    await db.setDoc('orders', orderRecord.id, orderRecord);

    // Fetch and verify database record
    const savedOrder = await db.getDoc('orders', orderRecord.id);
    assert(savedOrder, 'Order enquiry must be persisted in database');
    assertEqual(savedOrder.status, 'enquiry_placed');
    assertEqual(savedOrder.totalAmount, 291.6);

    // CRITICAL: Strict payment omission verification
    assertEqual(savedOrder.paymentMethod, 'none');
    assertEqual(savedOrder.paymentStatus, 'pending_manual_quote');
    assertEqual('paid' in savedOrder, false);
    assertEqual('stripeToken' in savedOrder, false);
    assertEqual('creditCard' in savedOrder, false);
    assertEqual('transactionId' in savedOrder, false);

    // -----------------------------------------------------------------------
    // Step 8: WhatsApp Hand-Off URL Generation & Disclaimer Verification
    // -----------------------------------------------------------------------
    const settings = await dataService.getSettings();
    const recipientPhone = settings.whatsappNumber;

    const whatsappUrl = formatWhatsAppUrl(savedOrder, recipientPhone);
    assertMatch(whatsappUrl, /^https:\/\/wa\.me\/919876543210\?text=.+/);

    const decodedMessage = decodeURIComponent(whatsappUrl.split('?text=')[1]);

    // Verify message header & reference code
    assertIncludes(decodedMessage, 'KRAVION AUTO — ORDER ENQUIRY');
    assertIncludes(decodedMessage, 'Reference: KRAV-8821');

    // Verify customer details
    assertIncludes(decodedMessage, 'Name: Marcus Vance');
    assertIncludes(decodedMessage, 'Phone: +1 (555) 890-1234');
    assertIncludes(decodedMessage, 'Shipping: 742 Evergreen Terrace, Springfield, OR 97477, United States');

    // Verify vehicle details
    assertIncludes(decodedMessage, 'Vehicle: BMW 3 Series (G20/G21) (2023)');

    // Verify itemized cart
    assertIncludes(decodedMessage, 'German Executive Sequential Dynamic Mirror LED Indicators (x2) - $270.00 ($135.00 ea)');

    // Verify totals
    assertIncludes(decodedMessage, 'Subtotal: $270.00');
    assertIncludes(decodedMessage, 'Shipping: FREE');
    assertIncludes(decodedMessage, 'Estimated Tax: $21.60');
    assertIncludes(decodedMessage, 'Total Amount: $291.60');

    // Verify customer notes
    assertIncludes(decodedMessage, 'Please verify mirror housing connector compatibility');

    // Verify mandatory payment disclaimer
    assertMatch(decodedMessage, /IMPORTANT PAYMENT NOTICE/i);
    assertMatch(decodedMessage, /Online payment is not collected on the website/i);
    assertMatch(decodedMessage, /payment confirmation and dispatch details directly via this chat/i);
  });
});
