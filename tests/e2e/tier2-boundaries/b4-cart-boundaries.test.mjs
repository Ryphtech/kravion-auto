/**
 * Tier 2 Boundary Test: B4 - Shopping Cart Operations & Arithmetic Precision Boundaries
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md § Feature 18
 * Boundaries: Adding 0 quantity, adding negative quantity, exceeding stock/max limits (99),
 * floating point math precision (0.1 + 0.2 IEEE 754), empty cart calculations, free shipping threshold edge.
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertThrows,
} from '../helpers/assertions.mjs';
import { mockProducts } from '../helpers/mock-data.mjs';
import { calculateCartTotals } from '../helpers/test-env.mjs';

class RobustCart {
  constructor(maxQuantityPerItem = 99) {
    this.items = [];
    this.maxQuantityPerItem = maxQuantityPerItem;
  }

  addItem(product, quantity = 1) {
    if (quantity === 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    const availableInventory = product.stock?.inventory ?? this.maxQuantityPerItem;
    const effectiveMax = Math.min(this.maxQuantityPerItem, availableInventory);

    const existing = this.items.find(i => i.productId === product.id);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > effectiveMax) {
        throw new Error(`Cannot exceed max quantity of ${effectiveMax} for item`);
      }
      existing.quantity = newQty;
      existing.subtotal = Math.round(existing.quantity * existing.price * 100) / 100;
    } else {
      if (quantity > effectiveMax) {
        throw new Error(`Cannot exceed max quantity of ${effectiveMax} for item`);
      }
      this.items.push({
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity,
        subtotal: Math.round(quantity * product.price * 100) / 100,
      });
    }
    return this.getTotals();
  }

  updateQuantity(productId, newQty) {
    if (newQty < 0) {
      throw new Error('Quantity cannot be negative');
    }
    if (newQty === 0) {
      return this.removeItem(productId);
    }
    const item = this.items.find(i => i.productId === productId);
    if (!item) return this.getTotals();

    if (newQty > this.maxQuantityPerItem) {
      throw new Error(`Cannot exceed max quantity of ${this.maxQuantityPerItem}`);
    }
    item.quantity = newQty;
    item.subtotal = Math.round(item.quantity * item.price * 100) / 100;
    return this.getTotals();
  }

  removeItem(productId) {
    this.items = this.items.filter(i => i.productId !== productId);
    return this.getTotals();
  }

  getTotals(options = {}) {
    return calculateCartTotals(this.items, options);
  }

  clear() {
    this.items = [];
    return this.getTotals();
  }
}

describe('Tier 2: B4 - Shopping Cart Operations & Arithmetic Precision Boundaries', () => {
  let cart;
  const prod = mockProducts[0]; // Price: 489.0, stock inventory: 15

  beforeEach(() => {
    cart = new RobustCart(99);
  });

  test('B4.1: adding 0 quantity throws explicit validation error and leaves cart untouched', () => {
    assertThrows(() => {
      cart.addItem(prod, 0);
    }, 'Quantity must be greater than 0');

    assertEqual(cart.items.length, 0);
    const totals = cart.getTotals();
    assertEqual(totals.itemCount, 0);
  });

  test('B4.2: adding negative quantity throws validation error and prevents corruption', () => {
    assertThrows(() => {
      cart.addItem(prod, -1);
    }, 'Quantity cannot be negative');

    assertThrows(() => {
      cart.addItem(prod, -99);
    }, 'Quantity cannot be negative');

    assertEqual(cart.items.length, 0);
  });

  test('B4.3: exceeding maximum stock limit (inventory limit / max 99) is blocked', () => {
    // prod inventory is 15
    assertThrows(() => {
      cart.addItem(prod, 16);
    }, /Cannot exceed max quantity/);

    // Add up to inventory limit (15)
    cart.addItem(prod, 15);
    assertEqual(cart.items[0].quantity, 15);

    // Attempting to add 1 more exceeds available stock
    assertThrows(() => {
      cart.addItem(prod, 1);
    }, /Cannot exceed max quantity/);
  });

  test('B4.4: floating-point arithmetic precision: avoids 0.1 + 0.2 IEEE 754 precision artifacts', () => {
    // In raw JS: 0.10 + 0.20 === 0.30000000000000004
    const item1 = { id: 'nano-bolt-1', title: 'Aero Bolt A', price: 0.10 };
    const item2 = { id: 'nano-bolt-2', title: 'Aero Bolt B', price: 0.20 };

    const totals = calculateCartTotals([
      { price: item1.price, quantity: 1 },
      { price: item2.price, quantity: 1 },
    ]);

    // Subtotal must strictly equal 0.30, not 0.30000000000000004
    assertEqual(totals.subtotal, 0.30, 'Subtotal must be clean 0.30');

    // Multi-decimal product prices ($19.99 * 3 + $49.95 * 2)
    // 59.97 + 99.90 = 159.87
    const totalsComplex = calculateCartTotals([
      { price: 19.99, quantity: 3 },
      { price: 49.95, quantity: 2 },
    ]);
    assertEqual(totalsComplex.subtotal, 159.87);
  });

  test('B4.5: empty cart total calculation returns strict zeroes across all accounting fields', () => {
    const emptyTotals = cart.getTotals();
    assertEqual(emptyTotals.subtotal, 0);
    assertEqual(emptyTotals.shipping, 0);
    assertEqual(emptyTotals.tax, 0);
    assertEqual(emptyTotals.totalAmount, 0);
    assertEqual(emptyTotals.itemCount, 0);
  });

  test('B4.6: free shipping threshold exact boundary analysis ($99.99 vs $100.00 vs $100.01)', () => {
    const threshold = 100.0;
    const shippingCost = 15.0;

    // Boundary 1: $99.99 (< threshold) -> Must charge shipping ($15.00)
    const tBelow = calculateCartTotals([{ price: 99.99, quantity: 1 }], {
      freeShippingThreshold: threshold,
      defaultShippingCost: shippingCost,
      taxRatePercent: 0,
    });
    assertEqual(tBelow.subtotal, 99.99);
    assertEqual(tBelow.shipping, 15.00, 'Under threshold must incur shipping fee');
    assertEqual(tBelow.totalAmount, 114.99);

    // Boundary 2: $100.00 (exact threshold) -> Free shipping ($0.00)
    const tExact = calculateCartTotals([{ price: 100.00, quantity: 1 }], {
      freeShippingThreshold: threshold,
      defaultShippingCost: shippingCost,
      taxRatePercent: 0,
    });
    assertEqual(tExact.subtotal, 100.00);
    assertEqual(tExact.shipping, 0.00, 'Exact threshold must qualify for free shipping');
    assertEqual(tExact.totalAmount, 100.00);

    // Boundary 3: $100.01 (> threshold) -> Free shipping ($0.00)
    const tAbove = calculateCartTotals([{ price: 100.01, quantity: 1 }], {
      freeShippingThreshold: threshold,
      defaultShippingCost: shippingCost,
      taxRatePercent: 0,
    });
    assertEqual(tAbove.subtotal, 100.01);
    assertEqual(tAbove.shipping, 0.00, 'Above threshold must qualify for free shipping');
    assertEqual(tAbove.totalAmount, 100.01);
  });
});
