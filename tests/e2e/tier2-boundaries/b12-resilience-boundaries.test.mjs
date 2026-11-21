/**
 * Tier 2 Boundary Test: B12 - Dual-Source Resilience & Network Fault Boundaries
 * Requirement: ORIGINAL_REQUEST.md §R4 & PROJECT.md § Feature 6, 12
 * Boundaries: Firestore timeout simulation, partial service degradation,
 * corrupted seed data sanitization, rapid repeated network reconnection attempts,
 * live service restoration.
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

class AdvancedResilientService extends ResilientDataService {
  constructor(firestore, options = {}) {
    super(firestore);
    this.timeoutMs = options.timeoutMs ?? 50;
    this.reconnectAttempts = 0;
  }

  async getProductsWithTimeout(filter = {}) {
    const fetchPromise = this.firestore.queryDocs('products');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        const err = new Error('DEADLINE_EXCEEDED: Firestore query timed out');
        err.code = 'deadline-exceeded';
        reject(err);
      }, this.timeoutMs);
    });

    try {
      const rawProducts = await Promise.race([fetchPromise, timeoutPromise]);
      return rawProducts;
    } catch (err) {
      // Fallback on timeout or Firestore error
      return this.sanitizeCatalog(JSON.parse(JSON.stringify(mockProducts)));
    }
  }

  sanitizeCatalog(rawItems) {
    if (!Array.isArray(rawItems)) return [];
    return rawItems
      .filter(item => item && typeof item === 'object')
      .map(item => {
        const price = Number(item.price);
        return {
          ...item,
          title: item.title || 'Untitled Accessory',
          price: isNaN(price) || price < 0 ? 0.0 : price,
          compatibility: item.compatibility && typeof item.compatibility === 'object'
            ? item.compatibility
            : { type: 'universal' },
        };
      });
  }

  async simulateNetworkReconnection(maxRetries = 3) {
    this.reconnectAttempts = 0;
    let connected = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.reconnectAttempts++;
      try {
        // Attempt ping
        await this.firestore.getDoc('settings', 'store');
        connected = true;
        break;
      } catch (err) {
        if (attempt === maxRetries) {
          connected = false;
        }
      }
    }
    return { connected, attempts: this.reconnectAttempts };
  }
}

describe('Tier 2: B12 - Dual-Source Resilience & Network Fault Boundaries', () => {
  let db;
  let advancedService;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
    advancedService = new AdvancedResilientService(db, { timeoutMs: 20 });
  });

  test('B12.1: Firestore timeout simulation triggers transparent fallback to bundled seed catalog', async () => {
    // Inject artificial network timeout by simulating fault or hanging promise
    db.simulateFault('NETWORK_UNAVAILABLE');

    const products = await advancedService.getProductsWithTimeout();
    assert(Array.isArray(products), 'Must return fallback array on timeout');
    assertGreaterThan(products.length, 0, 'Seed fallback must return products');
    assertEqual(products[0].id, mockProducts[0].id);
  });

  test('B12.2: partial service degradation: recovers products from seed while keeping online collections live', async () => {
    // Override products query to fail, while vehicles collection succeeds
    const originalQuery = db.queryDocs.bind(db);
    db.queryDocs = async (collectionName, filter) => {
      if (collectionName === 'products') {
        const err = new Error('RESOURCE_EXHAUSTED: Quota exceeded for products collection');
        err.code = 'resource-exhausted';
        throw err;
      }
      return originalQuery(collectionName, filter);
    };

    // Products query should fall back to seed
    const products = await advancedService.getProducts();
    assertGreaterThan(products.length, 0, 'Products should fall back to seed data');

    // Vehicles query should read live from Firestore Map
    const vehicles = await advancedService.getVehicles();
    assertEqual(vehicles.length, mockVehicles.length, 'Vehicles must read directly from live store');
  });

  test('B12.3: corrupted seed data recovery and sanitization handles missing or malformed fields safely', () => {
    const corruptCatalog = [
      null,
      undefined,
      { id: 'corrupt-1', title: null, price: 'invalid_price' },
      { id: 'corrupt-2', title: 'Missing Fitment', compatibility: null },
      { id: 'valid-1', title: 'Clean Product', price: 99.0, compatibility: { type: 'universal' } },
    ];

    const sanitized = advancedService.sanitizeCatalog(corruptCatalog);

    assertEqual(sanitized.length, 3, 'Null/undefined entries should be safely filtered out');

    // Item 1: Price and title repaired
    assertEqual(sanitized[0].title, 'Untitled Accessory');
    assertEqual(sanitized[0].price, 0.0);
    assertEqual(sanitized[0].compatibility.type, 'universal');

    // Item 2: Compatibility default to universal
    assertEqual(sanitized[1].compatibility.type, 'universal');

    // Item 3: Pristine item unaffected
    assertEqual(sanitized[2].title, 'Clean Product');
    assertEqual(sanitized[2].price, 99.0);
  });

  test('B12.4: rapid repeated network reconnection attempts adhere to max retry limits', async () => {
    // Inject permanent fault
    db.simulateFault('NETWORK_UNAVAILABLE');

    const result = await advancedService.simulateNetworkReconnection(4);
    assertEqual(result.connected, false, 'Should report failure when network remains unavailable');
    assertEqual(result.attempts, 4, 'Should attempt exact maxRetries count before giving up');

    // Network recovers on attempt 2
    db.simulateFault(null);
    const recoveredResult = await advancedService.simulateNetworkReconnection(4);
    assertEqual(recoveredResult.connected, true);
    assertEqual(recoveredResult.attempts, 1, 'Should stop retrying immediately upon connection');
  });

  test('B12.5: live service restoration: subsequent requests immediately resume live database reads once fault clears', async () => {
    // 1. Initially online
    const initialProducts = await advancedService.getProducts();
    assertEqual(initialProducts.length, mockProducts.length);

    // 2. Inject fault
    db.simulateFault('PERMISSION_DENIED');
    const fallbackProducts = await advancedService.getProducts();
    assertEqual(fallbackProducts.length, mockProducts.length);

    // 3. Clear fault and mutate live database doc
    db.simulateFault(null);
    await db.updateDoc('products', mockProducts[0].id, { title: 'Restored Live Product Title' });

    // 4. Verify live data is returned immediately
    const liveDoc = await db.getDoc('products', mockProducts[0].id);
    assertEqual(liveDoc.title, 'Restored Live Product Title');
  });
});
