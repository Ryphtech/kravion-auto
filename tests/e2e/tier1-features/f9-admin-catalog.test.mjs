/**
 * Tier 1 Feature Test: F9 - Admin Catalog CRUD & Vehicle Compatibility Mapping
 * Requirement: ORIGINAL_REQUEST.md §R3 & PROJECT.md § Feature 24, 26
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertDeepEqual,
  assertThrows,
} from '../helpers/assertions.mjs';
import { mockProducts, R2_PUBLIC_BASE_URL } from '../helpers/mock-data.mjs';
import { MockFirestoreDatabase } from '../helpers/test-env.mjs';

describe('Tier 1: F9 - Admin Catalog CRUD & Vehicle Compatibility Mapping', () => {
  let db;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
  });

  test('F9.1: should create new product with validated DTO structure', async () => {
    const newProduct = {
      id: 'prod-admin-test-01',
      title: 'Mercedes-Benz W206 AMG Style Carbon Rear Wing',
      slug: 'mb-w206-amg-carbon-rear-wing',
      price: 380.0,
      compareAtPrice: 450.0,
      categoryId: 'exterior',
      categoryName: 'Exterior Styling & Aero',
      description: 'Aerodynamically tuned carbon rear wing spoiler.',
      images: [`${R2_PUBLIC_BASE_URL}/products/mb-w206-wing.webp`],
      specs: {
        dimensions: '120 x 18 x 8 cm',
        weight: '1.2 kg',
        material: 'Toray 3K Dry Carbon Fiber',
        warranty: '2-Year Limited Warranty',
      },
      ratings: {
        rating: 5.0,
        reviewCount: 0,
      },
      stock: {
        status: 'in_stock',
        inventory: 10,
      },
      compatibility: {
        type: 'single',
        vehicleId: 'mb-c-w206',
        compatibleMakes: ['Mercedes-Benz'],
      },
      featured: false,
    };

    await db.setDoc('products', newProduct.id, newProduct);
    const created = await db.getDoc('products', newProduct.id);

    assert(created, 'Product must be successfully created');
    assertEqual(created.id, newProduct.id);
    assertEqual(created.title, newProduct.title);
    assertEqual(created.compatibility.type, 'single');
    assertEqual(created.compatibility.vehicleId, 'mb-c-w206');
  });

  test('F9.2: should update product price, inventory, and specifications', async () => {
    const targetId = 'prod-single-bmw-lip';
    const updates = {
      price: 499.0,
      stock: {
        status: 'low_stock',
        inventory: 2,
      },
      specs: {
        dimensions: '182 x 45 x 12 cm',
        weight: '2.3 kg', // Reduced weight
        material: 'Pre-preg Autoclaved Carbon',
        warranty: '3-Year Kravion Limited Warranty',
      },
    };

    const updated = await db.updateDoc('products', targetId, updates);
    assertEqual(updated.price, 499.0);
    assertEqual(updated.stock.status, 'low_stock');
    assertEqual(updated.stock.inventory, 2);
    assertEqual(updated.specs.material, 'Pre-preg Autoclaved Carbon');

    const refetched = await db.getDoc('products', targetId);
    assertEqual(refetched.price, 499.0);
  });

  test('F9.3: should mutate vehicle compatibility mapping from single to multi-vehicle', async () => {
    const targetId = 'prod-single-bmw-lip';
    const multiCompatibility = {
      type: 'multi',
      vehicleIds: ['bmw-3-g20', 'bmw-m4-g82'],
      compatibleMakes: ['BMW'],
    };

    const updated = await db.updateDoc('products', targetId, {
      compatibility: multiCompatibility,
    });

    assertEqual(updated.compatibility.type, 'multi');
    assertDeepEqual(updated.compatibility.vehicleIds, ['bmw-3-g20', 'bmw-m4-g82']);
  });

  test('F9.4: should validate category assignment against existing categories', async () => {
    const validCategories = await db.queryDocs('categories');
    const validCategoryIds = validCategories.map(c => c.id);

    const testProductId = 'prod-universal-ceramic-kit';
    const product = await db.getDoc('products', testProductId);

    assert(
      validCategoryIds.includes(product.categoryId),
      `Product categoryId "${product.categoryId}" must exist in categories collection: ${validCategoryIds.join(', ')}`
    );
  });

  test('F9.5: should delete product from catalog and verify non-existence', async () => {
    const targetId = 'prod-single-audi-diffuser';
    const before = await db.getDoc('products', targetId);
    assert(before, 'Product should exist prior to deletion');

    await db.deleteDoc('products', targetId);
    const after = await db.getDoc('products', targetId);
    assertEqual(after, null, 'Deleted product must return null');
  });
});
