/**
 * Tier 2 Boundary Test: B9 - Admin Catalog CRUD & Data Integrity Boundaries
 * Requirement: ORIGINAL_REQUEST.md §R3 & PROJECT.md § Feature 24, 26
 * Boundaries: Duplicate product ID collision, missing required fields during creation,
 * deleting non-existent product, updating with invalid category ID, updating non-existent document.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertThrows,
  assertGreaterThan,
} from '../helpers/assertions.mjs';
import { mockProducts } from '../helpers/mock-data.mjs';
import { MockFirestoreDatabase } from '../helpers/test-env.mjs';

class AdminCatalogService {
  constructor(firestore) {
    this.db = firestore;
  }

  async createProduct(productData) {
    if (!productData) throw new Error('Product payload is required');
    if (!productData.id || !productData.id.trim()) throw new Error('Product id is required');
    if (!productData.title || !productData.title.trim()) throw new Error('Product title is required');
    if (typeof productData.price !== 'number' || productData.price < 0) {
      throw new Error('Valid non-negative product price is required');
    }
    if (!productData.categoryId || !productData.categoryId.trim()) {
      throw new Error('Product categoryId is required');
    }
    if (!productData.compatibility || !productData.compatibility.type) {
      throw new Error('Product compatibility specification is required');
    }

    // Check duplicate ID
    const existing = await this.db.getDoc('products', productData.id);
    if (existing) {
      throw new Error(`Product with ID "${productData.id}" already exists`);
    }

    // Validate category exists
    const category = await this.db.getDoc('categories', productData.categoryId);
    if (!category) {
      throw new Error(`Category "${productData.categoryId}" does not exist in catalogue`);
    }

    await this.db.setDoc('products', productData.id, productData);
    return productData;
  }

  async updateProduct(id, updates) {
    if (!id || typeof id !== 'string') throw new Error('Product ID is required');

    // If updating category, ensure it exists
    if (updates.categoryId) {
      const category = await this.db.getDoc('categories', updates.categoryId);
      if (!category) {
        throw new Error(`Cannot update: Category "${updates.categoryId}" does not exist`);
      }
    }

    // If updating price, ensure non-negative
    if (updates.price !== undefined && (typeof updates.price !== 'number' || updates.price < 0)) {
      throw new Error('Cannot update: Price cannot be negative');
    }

    return await this.db.updateDoc('products', id, updates);
  }

  async deleteProduct(id) {
    const existing = await this.db.getDoc('products', id);
    if (!existing) {
      return { success: false, message: `Product ${id} not found` };
    }
    await this.db.deleteDoc('products', id);
    return { success: true };
  }
}

describe('Tier 2: B9 - Admin Catalog CRUD & Data Integrity Boundaries', () => {
  let db;
  let adminService;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
    adminService = new AdminCatalogService(db);
  });

  test('B9.1: creating product with duplicate ID throws collision error and preserves existing document', async () => {
    const existingId = mockProducts[0].id;
    const existingDocBefore = await db.getDoc('products', existingId);

    const duplicatePayload = {
      id: existingId,
      title: 'Duplicate Attempt Title',
      price: 199.0,
      categoryId: 'exterior',
      compatibility: { type: 'universal' },
    };

    await assertThrows(async () => {
      await adminService.createProduct(duplicatePayload);
    }, `Product with ID "${existingId}" already exists`);

    // Verify existing product was NOT modified or overwritten
    const existingDocAfter = await db.getDoc('products', existingId);
    assertEqual(existingDocAfter.title, existingDocBefore.title);
    assertEqual(existingDocAfter.price, existingDocBefore.price);
  });

  test('B9.2: creating product with missing required fields (title, price, category, compatibility) is rejected', async () => {
    const validProto = {
      id: 'prod-valid-proto',
      title: 'Carbon Splitter Winglet',
      price: 150.0,
      categoryId: 'exterior',
      compatibility: { type: 'universal' },
    };

    // Missing ID
    await assertThrows(async () => {
      await adminService.createProduct({ ...validProto, id: '' });
    }, 'Product id is required');

    // Missing Title
    await assertThrows(async () => {
      await adminService.createProduct({ ...validProto, title: '  ' });
    }, 'Product title is required');

    // Missing Price / Negative Price
    await assertThrows(async () => {
      await adminService.createProduct({ ...validProto, price: -10 });
    }, /Valid non-negative product price is required/);

    // Missing Category
    await assertThrows(async () => {
      await adminService.createProduct({ ...validProto, categoryId: null });
    }, 'Product categoryId is required');

    // Missing Compatibility
    await assertThrows(async () => {
      await adminService.createProduct({ ...validProto, compatibility: null });
    }, 'Product compatibility specification is required');
  });

  test('B9.3: deleting non-existent product ID returns non-fatal failure status without crashing', async () => {
    const ghostId = 'phantom-prod-xyz-999999';
    const initialCount = (await db.queryDocs('products')).length;

    const result = await adminService.deleteProduct(ghostId);
    assertEqual(result.success, false);
    assertGreaterThan(result.message.length, 0);

    const finalCount = (await db.queryDocs('products')).length;
    assertEqual(finalCount, initialCount, 'Total product count must not change after attempting to delete ghost product');
  });

  test('B9.4: updating product with invalid/non-existent category ID is rejected', async () => {
    const targetId = mockProducts[0].id;
    const invalidCatId = 'non-existent-flying-cars-category';

    await assertThrows(async () => {
      await adminService.updateProduct(targetId, { categoryId: invalidCatId });
    }, /does not exist/);

    // Product retains previous category
    const product = await db.getDoc('products', targetId);
    assertEqual(product.categoryId, mockProducts[0].categoryId);
  });

  test('B9.5: updating non-existent product ID throws document not found exception', async () => {
    const ghostId = 'non-existent-product-id-9988';

    await assertThrows(async () => {
      await adminService.updateProduct(ghostId, { price: 299.0 });
    }, `Document ${ghostId} not found in collection products`);
  });

  test('B9.6: updating product with negative price is blocked', async () => {
    const targetId = mockProducts[0].id;

    await assertThrows(async () => {
      await adminService.updateProduct(targetId, { price: -99.99 });
    }, 'Cannot update: Price cannot be negative');

    const product = await db.getDoc('products', targetId);
    assertEqual(product.price, mockProducts[0].price);
  });
});
