/**
 * Tier 4 - Scenario 3: Garage Fitment Matrix & Multi-Vehicle Compatibility Switching
 * Specification: TEST_INFRA.md § Real-World Application Scenarios (Scenario 3)
 * Features Exercised: F1, F2, F3, F4
 *
 * Flow:
 * 1. Customer adds 3 items to shopping cart spanning all 3 compatibility tiers:
 *    - Single-vehicle fitment: BMW G20 Dry Carbon Front Splitter
 *    - Multi-vehicle fitment: German Executive Sequential Dynamic Mirror LED (Audi, BMW, Mercedes)
 *    - Universal fitment: Kravion Ultra-Hydrophobic 9H Ceramic Coating Protection Kit
 * 2. Evaluates cart-level vehicle compatibility while toggling across garage vehicles:
 *    - State 1: Audi A4 Sedan (B9) -> Item 1 is flagged with fitment warning; Items 2 & 3 pass.
 *    - State 2: Mercedes-Benz C-Class (W206) -> Item 1 is flagged with fitment warning; Items 2 & 3 pass.
 *    - State 3: BMW 3 Series (G20) -> All 3 items pass (exact_match, multi_match, universal). Warning cleared!
 *    - State 4: Garage vehicle cleared to null -> Prompts customer to select vehicle to verify fitment.
 * 3. Customer confirms BMW 3 Series in Garage and proceeds with checkout.
 * 4. Verifies order enquiry captures vehicle context and WhatsApp hand-off message itemizes
 *    compatibility notes and totals accurately.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertMatch,
  assertIncludes,
} from '../helpers/assertions.mjs';
import {
  mockVehicles,
  mockProducts,
} from '../helpers/mock-data.mjs';
import {
  MockFirestoreDatabase,
  checkCompatibility,
  formatWhatsAppUrl,
  calculateCartTotals,
} from '../helpers/test-env.mjs';

describe('Tier 4: Scenario 3 - Garage Fitment Matrix & Multi-Vehicle Compatibility Switching', () => {
  let db;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
  });

  test('dynamically toggles garage vehicles across universal, single, and multi-fitment cart items and checks warnings', async () => {
    // -----------------------------------------------------------------------
    // Step 1: Prepare items of the 3 distinct compatibility tiers
    // -----------------------------------------------------------------------
    const singleBmwProd = mockProducts.find(p => p.id === 'prod-single-bmw-lip');
    const multiGermanProd = mockProducts.find(p => p.id === 'prod-multi-german-led');
    const universalProd = mockProducts.find(p => p.id === 'prod-universal-ceramic-kit');

    assert(singleBmwProd && multiGermanProd && universalProd, 'All 3 product fixtures must exist');
    assertEqual(singleBmwProd.compatibility.type, 'single');
    assertEqual(multiGermanProd.compatibility.type, 'multi');
    assertEqual(universalProd.compatibility.type, 'universal');

    const cart = [
      { product: singleBmwProd, quantity: 1, price: singleBmwProd.price },
      { product: multiGermanProd, quantity: 2, price: multiGermanProd.price },
      { product: universalProd, quantity: 1, price: universalProd.price },
    ];

    // Helper: annotate cart with compatibility for a given garage vehicle
    function evaluateCartFitment(cartItems, vehicle) {
      return cartItems.map(item => {
        const fitment = checkCompatibility(item.product, vehicle);
        return {
          ...item,
          fitment,
          hasWarning: !fitment.compatible,
        };
      });
    }

    // -----------------------------------------------------------------------
    // Step 2: Test State 1 - Selected Vehicle: Audi A4 (B9)
    // -----------------------------------------------------------------------
    const audiA4 = mockVehicles.find(v => v.id === 'audi-a4-b9');
    assert(audiA4, 'Audi A4 vehicle must exist');

    const audiEvaluation = evaluateCartFitment(cart, audiA4);

    // Item 1 (BMW Lip): Incompatible with Audi A4 -> Must trigger warning
    assertEqual(audiEvaluation[0].hasWarning, true);
    assertEqual(audiEvaluation[0].fitment.compatible, false);
    assertEqual(audiEvaluation[0].fitment.reason, 'incompatible');
    assertMatch(audiEvaluation[0].fitment.label, /Does Not Fit A4/i);

    // Item 2 (Multi LED): Compatible with Audi A4 (multi_match)
    assertEqual(audiEvaluation[1].hasWarning, false);
    assertEqual(audiEvaluation[1].fitment.compatible, true);
    assertEqual(audiEvaluation[1].fitment.reason, 'multi_match');

    // Item 3 (Universal Ceramic): Compatible (universal)
    assertEqual(audiEvaluation[2].hasWarning, false);
    assertEqual(audiEvaluation[2].fitment.compatible, true);
    assertEqual(audiEvaluation[2].fitment.reason, 'universal');

    // -----------------------------------------------------------------------
    // Step 3: Test State 2 - Toggle to Mercedes-Benz C-Class (W206)
    // -----------------------------------------------------------------------
    const mbCClass = mockVehicles.find(v => v.id === 'mb-c-w206');
    assert(mbCClass, 'Mercedes C-Class vehicle must exist');

    const mbEvaluation = evaluateCartFitment(cart, mbCClass);

    // Item 1: Incompatible with Mercedes -> Must trigger warning
    assertEqual(mbEvaluation[0].hasWarning, true);
    assertEqual(mbEvaluation[0].fitment.compatible, false);
    assertMatch(mbEvaluation[0].fitment.label, /Does Not Fit C-Class/i);

    // Items 2 & 3: Compatible
    assertEqual(mbEvaluation[1].hasWarning, false);
    assertEqual(mbEvaluation[1].fitment.compatible, true);
    assertEqual(mbEvaluation[2].hasWarning, false);
    assertEqual(mbEvaluation[2].fitment.compatible, true);

    // -----------------------------------------------------------------------
    // Step 4: Test State 3 - Toggle to BMW 3 Series (G20) -> 100% Fitment Match
    // -----------------------------------------------------------------------
    const bmwG20 = mockVehicles.find(v => v.id === 'bmw-3-g20');
    assert(bmwG20, 'BMW G20 vehicle must exist');

    const bmwEvaluation = evaluateCartFitment(cart, bmwG20);

    // Item 1: Exact match direct fit
    assertEqual(bmwEvaluation[0].hasWarning, false);
    assertEqual(bmwEvaluation[0].fitment.compatible, true);
    assertEqual(bmwEvaluation[0].fitment.reason, 'exact_match');
    assertMatch(bmwEvaluation[0].fitment.label, /Direct Fit for 3 Series/i);

    // Item 2: Multi match
    assertEqual(bmwEvaluation[1].hasWarning, false);
    assertEqual(bmwEvaluation[1].fitment.compatible, true);
    assertEqual(bmwEvaluation[1].fitment.reason, 'multi_match');

    // Item 3: Universal match
    assertEqual(bmwEvaluation[2].hasWarning, false);
    assertEqual(bmwEvaluation[2].fitment.compatible, true);
    assertEqual(bmwEvaluation[2].fitment.reason, 'universal');

    // Verify 0 warnings exist when BMW is active
    const warningCount = bmwEvaluation.filter(item => item.hasWarning).length;
    assertEqual(warningCount, 0, 'No vehicle compatibility warnings should exist for BMW G20');

    // -----------------------------------------------------------------------
    // Step 5: Test State 4 - Clear Garage (null vehicle)
    // -----------------------------------------------------------------------
    const nullEvaluation = evaluateCartFitment(cart, null);
    assertEqual(nullEvaluation[0].fitment.reason, 'select_vehicle');
    assertEqual(nullEvaluation[1].fitment.reason, 'select_vehicle');
    assertEqual(nullEvaluation[2].fitment.reason, 'universal'); // Universal still universal

    // -----------------------------------------------------------------------
    // Step 6: Checkout with BMW Garage Context & Validate Order and WhatsApp URL
    // -----------------------------------------------------------------------
    const totals = calculateCartTotals([
      { price: singleBmwProd.price, quantity: 1 },
      { price: multiGermanProd.price, quantity: 2 },
      { price: universalProd.price, quantity: 1 },
    ]);

    // Subtotal = 489 + (135 * 2) + 89 = 489 + 270 + 89 = 848.0
    assertEqual(totals.subtotal, 848.0);
    assertEqual(totals.shipping, 0.0); // Free shipping threshold met
    assertEqual(totals.tax, 67.84); // 8% of 848
    assertEqual(totals.totalAmount, 915.84);

    const orderRecord = {
      id: 'order-scenario3-fitment-switch',
      orderNumber: 'KRAV-FIT-003',
      customerName: 'Hans Gruber',
      customerPhone: '+49 151 23456789',
      customerEmail: 'hans.gruber@example.de',
      shippingAddress: {
        street: 'Kurfürstendamm 123',
        city: 'Berlin',
        state: 'BE',
        postalCode: '10711',
        country: 'Germany',
      },
      vehicleDetails: {
        make: bmwG20.make,
        model: bmwG20.model,
        year: '2022',
      },
      items: [
        {
          productId: singleBmwProd.id,
          title: singleBmwProd.title,
          price: singleBmwProd.price,
          quantity: 1,
          subtotal: singleBmwProd.price,
        },
        {
          productId: multiGermanProd.id,
          title: multiGermanProd.title,
          price: multiGermanProd.price,
          quantity: 2,
          subtotal: multiGermanProd.price * 2,
        },
        {
          productId: universalProd.id,
          title: universalProd.title,
          price: universalProd.price,
          quantity: 1,
          subtotal: universalProd.price,
        },
      ],
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      totalAmount: totals.totalAmount,
      status: 'enquiry_placed',
      paymentMethod: 'none',
      paymentStatus: 'pending_manual_quote',
      createdAt: new Date().toISOString(),
    };

    await db.setDoc('orders', orderRecord.id, orderRecord);

    const savedOrder = await db.getDoc('orders', orderRecord.id);
    assertEqual(savedOrder.vehicleDetails.make, 'BMW');
    assertEqual(savedOrder.vehicleDetails.model, '3 Series (G20/G21)');
    assertEqual(savedOrder.paymentMethod, 'none');

    // Generate WhatsApp hand-off message and verify vehicle details
    const waUrl = formatWhatsAppUrl(savedOrder, '919876543210');
    const decodedMessage = decodeURIComponent(waUrl);

    assertIncludes(decodedMessage, 'Vehicle: BMW 3 Series (G20/G21) (2022)');
    assertIncludes(decodedMessage, 'Total Amount: $915.84');
    assertIncludes(decodedMessage, 'Online payment is not collected on the website');
  });
});
