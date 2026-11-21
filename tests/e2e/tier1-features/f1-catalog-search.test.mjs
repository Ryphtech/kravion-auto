/**
 * Tier 1 Feature Test: F1 - Storefront Catalog & Faceted Search/Filter
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md § Feature 14
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertGreaterThan,
  assertIncludes,
} from '../helpers/assertions.mjs';
import { mockProducts } from '../helpers/mock-data.mjs';
import { MockFirestoreDatabase, ResilientDataService } from '../helpers/test-env.mjs';

describe('Tier 1: F1 - Storefront Catalog & Faceted Search/Filter', () => {
  let db;
  let dataService;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
    dataService = new ResilientDataService(db);
  });

  test('F1.1: should filter products by vehicle make', async () => {
    const bmwProducts = await dataService.getProducts({ make: 'BMW' });

    assertGreaterThan(bmwProducts.length, 0, 'Should find products matching BMW make');
    for (const prod of bmwProducts) {
      const isUniversal = prod.compatibility?.type === 'universal';
      const hasMake = prod.compatibility?.compatibleMakes?.includes('BMW');
      assert(
        isUniversal || hasMake,
        `Product ${prod.id} must be universal or explicitly support BMW, got ${JSON.stringify(prod.compatibility)}`
      );
    }

    // Ensure Audi-specific product is excluded
    const audiSpecific = bmwProducts.find(p => p.id === 'prod-single-audi-diffuser');
    assertEqual(audiSpecific, undefined, 'Audi-only product must not appear in BMW filtered results');
  });

  test('F1.2: should filter products by category', async () => {
    const lightingProducts = await dataService.getProducts({ categoryId: 'lighting' });

    assertGreaterThan(lightingProducts.length, 0, 'Should return products for category "lighting"');
    for (const prod of lightingProducts) {
      assertEqual(prod.categoryId, 'lighting', `Product ${prod.id} categoryId must be "lighting"`);
    }

    // Ensure non-lighting product is not present
    const nonLighting = lightingProducts.find(p => p.categoryId !== 'lighting');
    assertEqual(nonLighting, undefined, 'No non-lighting products should be returned');
  });

  test('F1.3: should search products by keyword in title or description', async () => {
    const results = await dataService.getProducts({ query: 'carbon' });

    assertGreaterThan(results.length, 0, 'Should find products matching keyword "carbon"');
    for (const prod of results) {
      const inTitle = prod.title.toLowerCase().includes('carbon');
      const inDesc = prod.description.toLowerCase().includes('carbon');
      assert(inTitle || inDesc, `Product ${prod.title} must contain "carbon" in title or description`);
    }
  });

  test('F1.4: should apply multi-condition faceted filtering (Make + Category + Keyword)', async () => {
    const results = await dataService.getProducts({
      make: 'BMW',
      categoryId: 'exterior',
      query: 'splitter',
    });

    assertGreaterThan(results.length, 0, 'Multi-condition search should return at least one matching item');
    const item = results[0];
    assertEqual(item.categoryId, 'exterior');
    assertIncludes(item.title.toLowerCase(), 'splitter');
    assert(
      item.compatibility.type === 'universal' || item.compatibility.compatibleMakes.includes('BMW'),
      'Product must be compatible with BMW'
    );
  });

  test('F1.5: should return full catalog when filters and search query are empty', async () => {
    const allProducts = await dataService.getProducts({});
    assertEqual(allProducts.length, mockProducts.length, 'Empty filter must return all catalog items');
  });

  test('F1.6: should return empty array when search query matches no products', async () => {
    const results = await dataService.getProducts({ query: 'zzznoxexistentproduct9999' });
    assertEqual(results.length, 0, 'Non-matching query must return empty array');
  });
});
