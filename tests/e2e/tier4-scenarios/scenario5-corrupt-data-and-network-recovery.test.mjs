/**
 * Tier 4 - Scenario 5: Firestore Permission-Denied / Network Resilience & Seed Fallback
 * Specification: TEST_INFRA.md § Real-World Application Scenarios (Scenario 5)
 * Features Exercised: F1, F6, F8, F12
 *
 * Flow:
 * 1. Establishes baseline: Firestore serves documents normally under stable connectivity.
 * 2. Fault Injection Phase 1 - Firestore Security Rules Rejection (PERMISSION_DENIED):
 *    - Storefront queries products, categories, banners, and settings.
 *    - ResilientDataService catches Firestore error and transparently falls back to
 *      bundled offline seed catalog.
 *    - Zero crashes or unhandled rejections; faceted filtering remains completely functional.
 * 3. Fault Injection Phase 2 - Network Failure (NETWORK_UNAVAILABLE):
 *    - Customer places order enquiry while offline.
 *    - Resilient local offline queue captures order with status "enquiry_placed".
 *    - Client-side WhatsApp hand-off engine formats complete wa.me checkout URL without network.
 * 4. Recovery & Synchronization Phase:
 *    - Network and permissions recover (fault cleared).
 *    - Local queue flushes pending orders into live Firestore database.
 *    - Verifies order persistence and strict zero-payment guarantee in Firestore.
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
  mockProducts,
  mockVehicles,
} from '../helpers/mock-data.mjs';
import {
  MockFirestoreDatabase,
  ResilientDataService,
  formatWhatsAppUrl,
  calculateCartTotals,
} from '../helpers/test-env.mjs';

describe('Tier 4: Scenario 5 - Firestore Permission-Denied / Network Resilience & Seed Fallback', () => {
  let db;
  let dataService;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
    dataService = new ResilientDataService(db);
  });

  test('survives permission denied and network outages with seed fallback and queued order recovery', async () => {
    // -----------------------------------------------------------------------
    // Step 1: Normal Operational Baseline
    // -----------------------------------------------------------------------
    const baselineProducts = await dataService.getProducts({});
    assertEqual(baselineProducts.length, mockProducts.length);

    // -----------------------------------------------------------------------
    // Step 2: Fault Injection 1 - PERMISSION_DENIED (Security Rules Failure)
    // -----------------------------------------------------------------------
    db.simulateFault('PERMISSION_DENIED');

    // 2a. Product Catalog Fallback: Full Catalog
    const fallbackAll = await dataService.getProducts({});
    assertEqual(fallbackAll.length, mockProducts.length);

    // 2b. Product Catalog Fallback: Faceted Filter (Make + Category)
    const fallbackBmwExterior = await dataService.getProducts({
      make: 'BMW',
      categoryId: 'exterior',
    });
    assertGreaterThan(fallbackBmwExterior.length, 0);
    const bmwLip = fallbackBmwExterior.find(p => p.id === 'prod-single-bmw-lip');
    assert(bmwLip, 'Fallback catalog must preserve BMW front splitter');

    // 2c. Product Catalog Fallback: Keyword Search
    const searchResults = await dataService.getProducts({ query: 'titanium' });
    assertGreaterThan(searchResults.length, 0);
    assertIncludes(searchResults[0].title.toLowerCase(), 'titanium');

    // 2d. Single Product Lookup Fallback
    const singleProduct = await dataService.getProductById('prod-single-bmw-lip');
    assert(singleProduct, 'Single product lookup must resolve from fallback');
    assertEqual(singleProduct.id, 'prod-single-bmw-lip');

    // 2e. Categories & Banners Fallback
    const categories = await dataService.getCategories();
    assertGreaterThan(categories.length, 0);

    const banners = await dataService.getBanners();
    assertGreaterThan(banners.length, 0);

    // 2f. Settings Fallback
    const settings = await dataService.getSettings();
    assert(settings.whatsappNumber, 'Settings must fallback to default admin configuration');

    // -----------------------------------------------------------------------
    // Step 3: Fault Injection 2 - NETWORK_UNAVAILABLE & Offline Order Queueing
    // -----------------------------------------------------------------------
    db.simulateFault('NETWORK_UNAVAILABLE');

    // Offline Order Queue Manager
    class OfflineOrderQueue {
      constructor(firestore) {
        this.firestore = firestore;
        this.queue = [];
      }

      async submitOrder(orderData) {
        try {
          // Attempt direct write to Firestore
          await this.firestore.setDoc('orders', orderData.id, orderData);
          return { success: true, queued: false, order: orderData };
        } catch (err) {
          // Graceful fallback: store in local offline queue
          const queuedRecord = {
            ...orderData,
            queuedLocally: true,
            queuedAt: new Date().toISOString(),
          };
          this.queue.push(queuedRecord);
          return { success: true, queued: true, order: queuedRecord };
        }
      }

      async flushQueue() {
        const synced = [];
        while (this.queue.length > 0) {
          const item = this.queue.shift();
          const { queuedLocally, queuedAt, ...cleanOrder } = item;
          await this.firestore.setDoc('orders', cleanOrder.id, cleanOrder);
          synced.push(cleanOrder);
        }
        return synced;
      }
    }

    const orderQueue = new OfflineOrderQueue(db);

    const offlineOrderPayload = {
      id: 'order-resilience-offline-999',
      orderNumber: 'KRAV-OFFLINE-999',
      customerName: 'Robert Vance',
      customerPhone: '+1 (555) 432-8765',
      customerEmail: 'robert.vance@example.com',
      shippingAddress: {
        street: '550 Pioneer Way',
        city: 'Mountain View',
        state: 'CA',
        postalCode: '94043',
        country: 'United States',
      },
      vehicleDetails: {
        make: 'BMW',
        model: '3 Series (G20/G21)',
        year: '2023',
      },
      items: [
        {
          productId: bmwLip.id,
          title: bmwLip.title,
          price: bmwLip.price,
          quantity: 1,
        },
      ],
      subtotal: bmwLip.price,
      shipping: 0.0,
      tax: 39.12,
      totalAmount: 528.12,
      status: 'enquiry_placed',
      paymentMethod: 'none',
      paymentStatus: 'pending_manual_quote',
      createdAt: new Date().toISOString(),
    };

    // Customer places order during network fault
    const submitResult = await orderQueue.submitOrder(offlineOrderPayload);
    assertEqual(submitResult.success, true);
    assertEqual(submitResult.queued, true, 'Order must be safely captured in local offline queue');
    assertEqual(orderQueue.queue.length, 1);

    // Client-side WhatsApp redirect URL formatting functions 100% offline
    const waUrl = formatWhatsAppUrl(submitResult.order, settings.whatsappNumber);
    assert(waUrl.startsWith('https://wa.me/'));
    const decodedMessage = decodeURIComponent(waUrl);
    assertIncludes(decodedMessage, 'KRAV-OFFLINE-999');
    assertIncludes(decodedMessage, 'Robert Vance');
    assertIncludes(decodedMessage, '$528.12');
    assertIncludes(decodedMessage, 'Online payment is not collected on the website');

    // -----------------------------------------------------------------------
    // Step 4: Connectivity Recovery & Queue Flusher Synchronization
    // -----------------------------------------------------------------------
    // Network is restored
    db.simulateFault(null);

    // Flush offline queue to live database
    const flushedItems = await orderQueue.flushQueue();
    assertEqual(flushedItems.length, 1);
    assertEqual(orderQueue.queue.length, 0);

    // Verify order is now queryable from Firestore database
    const syncedDoc = await db.getDoc('orders', offlineOrderPayload.id);
    assert(syncedDoc, 'Queued order must be persisted in Firestore upon network recovery');
    assertEqual(syncedDoc.id, 'order-resilience-offline-999');
    assertEqual(syncedDoc.status, 'enquiry_placed');
    assertEqual(syncedDoc.paymentMethod, 'none');
    assertEqual(syncedDoc.paymentStatus, 'pending_manual_quote');
    assertEqual('paid' in syncedDoc, false);
  });
});
