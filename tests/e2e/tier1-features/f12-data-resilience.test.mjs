/**
 * Tier 1 Feature Test: F12 - Cloud Services & Resilient Dual-Source Data Layer
 * Requirement: ORIGINAL_REQUEST.md §R4 & PROJECT.md § Data Layer Contract
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertGreaterThan,
  assertDeepEqual,
} from '../helpers/assertions.mjs';
import { mockProducts, mockVehicles, mockCategories } from '../helpers/mock-data.mjs';
import { MockFirestoreDatabase, ResilientDataService } from '../helpers/test-env.mjs';

describe('Tier 1: F12 - Cloud Services & Resilient Dual-Source Data Layer', () => {
  let db;
  let dataService;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
    dataService = new ResilientDataService(db);
  });

  test('F12.1: data layer successfully returns Firestore live documents under normal conditions', async () => {
    const products = await dataService.getProducts();
    assertGreaterThan(products.length, 0, 'Products should be returned when Firestore is online');
    assertEqual(products.length, mockProducts.length);
  });

  test('F12.2: data layer falls back transparently to bundled seed catalog when Firestore returns PERMISSION_DENIED', async () => {
    // Inject permission-denied fault
    db.simulateFault('PERMISSION_DENIED');

    const products = await dataService.getProducts();
    assert(Array.isArray(products), 'Must return an array of products despite permission-denied error');
    assertGreaterThan(products.length, 0, 'Seed fallback should provide catalog items');
    assertEqual(products[0].id, mockProducts[0].id);

    const vehicles = await dataService.getVehicles();
    assertGreaterThan(vehicles.length, 0, 'Seed fallback should provide vehicles');

    const categories = await dataService.getCategories();
    assertGreaterThan(categories.length, 0, 'Seed fallback should provide categories');
  });

  test('F12.3: data layer falls back transparently to seed catalog when Firestore backend is UNAVAILABLE', async () => {
    // Inject network unavailable fault
    db.simulateFault('NETWORK_UNAVAILABLE');

    const product = await dataService.getProductById('prod-single-bmw-lip');
    assert(product, 'Must retrieve product from seed catalog when network is unavailable');
    assertEqual(product.id, 'prod-single-bmw-lip');
    assertEqual(product.title, mockProducts[0].title);
  });

  test('F12.4: filtering and faceted search remain functional when operating in fallback mode', async () => {
    db.simulateFault('PERMISSION_DENIED');

    // Filter by BMW in fallback mode
    const bmwResults = await dataService.getProducts({ make: 'BMW' });
    assertGreaterThan(bmwResults.length, 0, 'Should filter seed catalog by make');
    for (const prod of bmwResults) {
      const isUniversal = prod.compatibility.type === 'universal';
      const hasMake = prod.compatibility.compatibleMakes.includes('BMW');
      assert(isUniversal || hasMake, 'Fallback results must respect filter');
    }

    // Filter by lighting category in fallback mode
    const lightingResults = await dataService.getProducts({ categoryId: 'lighting' });
    assertGreaterThan(lightingResults.length, 0, 'Should filter seed catalog by category');
    for (const prod of lightingResults) {
      assertEqual(prod.categoryId, 'lighting');
    }
  });

  test('F12.5: bundled seed catalog data structural integrity verification', () => {
    // Verify vehicles
    assertGreaterThan(mockVehicles.length, 5, 'Seed catalog should have multiple vehicle makes/models');
    for (const v of mockVehicles) {
      assert(v.id && v.make && v.model && v.yearRange, `Vehicle ${v.id} missing mandatory fields`);
    }

    // Verify categories
    assertGreaterThan(mockCategories.length, 3, 'Seed catalog should have multiple categories');
    for (const c of mockCategories) {
      assert(c.id && c.name && c.slug, `Category ${c.id} missing mandatory fields`);
    }

    // Verify products have compatibility structure
    for (const p of mockProducts) {
      assert(p.compatibility, `Product ${p.id} missing compatibility object`);
      assert(['single', 'multi', 'universal'].includes(p.compatibility.type));
    }
  });
});
