/**
 * Tier 2 Boundary Test: B1 - Storefront Catalog & Search Boundaries
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md § Feature 14
 * Boundaries: Empty strings, whitespace-only queries, SQL/XSS injections, Unicode/emojis, non-existent make/vehicle.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertGreaterThan,
} from '../helpers/assertions.mjs';
import { mockProducts } from '../helpers/mock-data.mjs';
import { MockFirestoreDatabase, ResilientDataService } from '../helpers/test-env.mjs';

describe('Tier 2: B1 - Storefront Catalog & Search Boundaries', () => {
  let db;
  let dataService;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
    dataService = new ResilientDataService(db);
  });

  test('B1.1: empty query string and empty filter return full catalog without throwing', async () => {
    const resEmptyObj = await dataService.getProducts({});
    assertEqual(resEmptyObj.length, mockProducts.length, 'Empty filter object must return all products');

    const resEmptyQuery = await dataService.getProducts({ query: '' });
    assertEqual(resEmptyQuery.length, mockProducts.length, 'Empty string query must return all products');

    const resUndefined = await dataService.getProducts(undefined);
    assertEqual(resUndefined.length, mockProducts.length, 'Undefined filter must safely return all products');
  });

  test('B1.2: whitespace-only query string is trimmed and does not crash or throw', async () => {
    const whitespaceQueries = ['   ', '\t\t\n', ' \r\n ', '       '];
    for (const ws of whitespaceQueries) {
      const results = await dataService.getProducts({ query: ws });
      // When trimmed to empty, it matches all products without syntax error
      assertEqual(results.length, mockProducts.length, `Whitespace query "${ws}" should match all products`);
    }
  });

  test('B1.3: SQL and script injection strings in search query are handled safely as literal strings', async () => {
    const injectionVectors = [
      `' OR '1'='1`,
      `'; DROP TABLE products; --`,
      `<script>alert("xss")</script>`,
      `" UNION SELECT * FROM users --`,
      `' OR 1=1 #`,
      `<img src=x onerror=alert(1)>`,
    ];

    for (const vector of injectionVectors) {
      const results = await dataService.getProducts({ query: vector });
      assert(Array.isArray(results), `Query with vector "${vector}" must return an array`);
      // Since no mock product title or description contains these strings, returns 0 matches safely
      assertEqual(results.length, 0, `Injection vector "${vector}" should safely return 0 results`);
    }
  });

  test('B1.4: Unicode, non-Latin, and emoji characters in search queries are handled safely', async () => {
    const unicodeQueries = ['🏎️', '⚡', 'BMW 🇩🇪', '碳纤维', 'مرحبًا', '🚗💨'];
    for (const uq of unicodeQueries) {
      const results = await dataService.getProducts({ query: uq });
      assert(Array.isArray(results), `Unicode query "${uq}" must return a valid array`);
    }

    // Keyword search with partial match if item contains symbol (e.g. 9H ceramic)
    const ceramic = await dataService.getProducts({ query: '9H' });
    assertGreaterThan(ceramic.length, 0, 'Should find products matching "9H"');
  });

  test('B1.5: filtering by non-existent vehicle make returns only universal products', async () => {
    const nonExistentMakes = ['DeLorean', 'Koenigsegg', 'UnknownMake999', 'CyberTruckMake'];
    const universalCount = mockProducts.filter(p => p.compatibility?.type === 'universal').length;

    for (const make of nonExistentMakes) {
      const results = await dataService.getProducts({ make });
      assertEqual(
        results.length,
        universalCount,
        `Filtering by unknown make "${make}" should return exactly all ${universalCount} universal products`
      );
      for (const prod of results) {
        assertEqual(prod.compatibility.type, 'universal', 'All returned products must be universal fitment');
      }
    }
  });

  test('B1.6: case-insensitivity boundary in make filter handles all permutations of uppercase/lowercase', async () => {
    const variations = ['bmw', 'BMW', 'Bmw', 'bMw', 'BmWSport'];
    for (const makeVar of variations.slice(0, 4)) {
      const results = await dataService.getProducts({ make: makeVar });
      assertGreaterThan(results.length, 0, `Make variation "${makeVar}" should return BMW-compatible products`);
      for (const prod of results) {
        const isUniv = prod.compatibility.type === 'universal';
        const hasBmw = prod.compatibility.compatibleMakes?.some(m => m.toLowerCase() === 'bmw');
        assert(isUniv || hasBmw, `Product ${prod.id} must be compatible with BMW`);
      }
    }
  });

  test('B1.7: filtering by non-existent categoryId returns an empty list without error', async () => {
    const results = await dataService.getProducts({ categoryId: 'non-existent-category-xyz-999' });
    assert(Array.isArray(results), 'Must return an array');
    assertEqual(results.length, 0, 'Non-existent categoryId must return 0 products');
  });
});
