/**
 * Tier 1 Feature Test: F4 - Shopping Cart Operations & Totals Math
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md § Feature 18
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertDeepEqual,
} from '../helpers/assertions.mjs';
import { mockProducts } from '../helpers/mock-data.mjs';
import { calculateCartTotals } from '../helpers/test-env.mjs';

class InMemoryCart {
  constructor() {
    this.items = [];
  }

  addItem(product, quantity = 1) {
    const existing = this.items.find(i => i.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
      existing.subtotal = Math.round(existing.quantity * existing.price * 100) / 100;
    } else {
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
    if (newQty <= 0) {
      return this.removeItem(productId);
    }
    const item = this.items.find(i => i.productId === productId);
    if (item) {
      item.quantity = newQty;
      item.subtotal = Math.round(item.quantity * item.price * 100) / 100;
    }
    return this.getTotals();
  }

  removeItem(productId) {
    this.items = this.items.filter(i => i.productId !== productId);
    return this.getTotals();
  }

  getTotals() {
    return calculateCartTotals(this.items);
  }

  clear() {
    this.items = [];
    return this.getTotals();
  }
}

describe('Tier 1: F4 - Shopping Cart Operations & Totals Math', () => {
  let cart;
  const prodA = mockProducts[0]; // $489.00
  const prodB = mockProducts[2]; // $89.00

  beforeEach(() => {
    cart = new InMemoryCart();
  });

  test('F4.1: should add item to cart with specified quantity', () => {
    const totals = cart.addItem(prodB, 1);
    assertEqual(cart.items.length, 1);
    assertEqual(cart.items[0].productId, prodB.id);
    assertEqual(cart.items[0].quantity, 1);
    assertEqual(cart.items[0].subtotal, 89.0);
    assertEqual(totals.itemCount, 1);
  });

  test('F4.2: should increment item quantity and update line subtotal', () => {
    cart.addItem(prodB, 1);
    const totals = cart.addItem(prodB, 2); // now quantity is 3
    assertEqual(cart.items.length, 1);
    assertEqual(cart.items[0].quantity, 3);
    assertEqual(cart.items[0].subtotal, 267.0);
    assertEqual(totals.itemCount, 3);
  });

  test('F4.3: should decrement item quantity and update totals correctly', () => {
    cart.addItem(prodB, 3);
    const totals = cart.updateQuantity(prodB.id, 2);
    assertEqual(cart.items[0].quantity, 2);
    assertEqual(cart.items[0].subtotal, 178.0);
    assertEqual(totals.itemCount, 2);
    assertEqual(totals.subtotal, 178.0);
  });

  test('F4.4: should remove item when quantity is reduced to 0 or via removeItem', () => {
    cart.addItem(prodA, 1);
    cart.addItem(prodB, 1);
    assertEqual(cart.items.length, 2);

    cart.updateQuantity(prodA.id, 0);
    assertEqual(cart.items.length, 1);
    assertEqual(cart.items[0].productId, prodB.id);

    cart.removeItem(prodB.id);
    assertEqual(cart.items.length, 0);
    const totals = cart.getTotals();
    assertEqual(totals.subtotal, 0);
    assertEqual(totals.totalAmount, 0);
  });

  test('F4.5: should calculate accurate subtotal across multiple distinct items', () => {
    cart.addItem(prodA, 2); // 2 * 489.0 = 978.0
    cart.addItem(prodB, 3); // 3 * 89.0 = 267.0
    const totals = cart.getTotals();

    const expectedSubtotal = 978.0 + 267.0; // 1245.00
    assertEqual(totals.subtotal, expectedSubtotal);
    assertEqual(totals.itemCount, 5);
  });

  test('F4.6: should calculate tax and free shipping threshold correctly', () => {
    // Under free shipping threshold ($89.00 < $100.00) -> Shipping is $15.00, Tax 8% is $7.12
    cart.addItem(prodB, 1);
    let totals = cart.getTotals();
    assertEqual(totals.subtotal, 89.0);
    assertEqual(totals.shipping, 15.0);
    assertEqual(totals.tax, 7.12);
    assertEqual(totals.totalAmount, 111.12);

    // Over free shipping threshold ($489.00 > $100.00) -> Shipping is $0.00, Tax 8% is $39.12
    cart.clear();
    cart.addItem(prodA, 1);
    totals = cart.getTotals();
    assertEqual(totals.subtotal, 489.0);
    assertEqual(totals.shipping, 0.0);
    assertEqual(totals.tax, 39.12);
    assertEqual(totals.totalAmount, 528.12);
  });
});
