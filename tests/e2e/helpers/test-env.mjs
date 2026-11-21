/**
 * Test Environment Configuration and Mock Providers for Kravion Auto E2E Tests.
 */

import {
  R2_PUBLIC_BASE_URL,
  mockVehicles,
  mockCategories,
  mockProducts,
  mockOrders,
  mockAdminSettings,
  mockCarouselPosters,
} from './mock-data.mjs';

export const ENV_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyAf-rGHLZHG0VUtpgN811UjetBhUTTfu74',
    authDomain: 'kravion-auto.firebaseapp.com',
    projectId: 'kravion-auto',
    storageBucket: 'kravion-auto.firebasestorage.app',
    messagingSenderId: '162661378547',
    appId: '1:162661378547:web:2e7040bd9ddc2914ebca86',
    measurementId: 'G-S6KSZBCBG6',
  },
  cloudflareR2: {
    bucketName: 'kravion-auto',
    publicDevUrl: 'https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev',
    s3Endpoint: 'https://d6e0e618a594c39ee7bf96cd59297564.r2.cloudflarestorage.com',
    accessKeyId: '1053aa24d7e128cff5da3170ec228598',
    secretAccessKey: '2d27a5f60d5c05a4fedea489f4f2f1d8d2d54fc8286878fddee7665cf7f7bece',
  },
  defaultWhatsAppNumber: '919876543210',
};

/**
 * In-memory Mock Firestore implementation with simulated fault injection.
 */
export class MockFirestoreDatabase {
  constructor() {
    this.reset();
  }

  reset() {
    this.collections = {
      vehicles: new Map(mockVehicles.map(v => [v.id, { ...v }])),
      categories: new Map(mockCategories.map(c => [c.id, { ...c }])),
      products: new Map(mockProducts.map(p => [p.id, JSON.parse(JSON.stringify(p))])),
      orders: new Map(mockOrders.map(o => [o.id, JSON.parse(JSON.stringify(o))])),
      banners: new Map(mockCarouselPosters.map(b => [b.id, { ...b }])),
      settings: new Map([['store', { ...mockAdminSettings }]]),
    };
    this.simulatedFault = null;
  }

  simulateFault(faultType) {
    // e.g. 'PERMISSION_DENIED', 'NETWORK_UNAVAILABLE', null
    this.simulatedFault = faultType;
  }

  _checkFault() {
    if (this.simulatedFault === 'PERMISSION_DENIED') {
      const err = new Error('Missing or insufficient permissions.');
      err.code = 'permission-denied';
      throw err;
    }
    if (this.simulatedFault === 'NETWORK_UNAVAILABLE') {
      const err = new Error('Could not reach Cloud Firestore backend. Backend connection failed.');
      err.code = 'unavailable';
      throw err;
    }
  }

  async getDoc(collectionName, id) {
    this._checkFault();
    const col = this.collections[collectionName];
    if (!col || !col.has(id)) return null;
    return JSON.parse(JSON.stringify(col.get(id)));
  }

  async setDoc(collectionName, id, data) {
    this._checkFault();
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = new Map();
    }
    this.collections[collectionName].set(id, JSON.parse(JSON.stringify(data)));
    return { id, ...data };
  }

  async updateDoc(collectionName, id, updates) {
    this._checkFault();
    const col = this.collections[collectionName];
    if (!col || !col.has(id)) {
      throw new Error(`Document ${id} not found in collection ${collectionName}`);
    }
    const existing = col.get(id);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    col.set(id, updated);
    return updated;
  }

  async deleteDoc(collectionName, id) {
    this._checkFault();
    const col = this.collections[collectionName];
    if (col) {
      col.delete(id);
    }
    return true;
  }

  async queryDocs(collectionName, filterPredicate) {
    this._checkFault();
    const col = this.collections[collectionName];
    if (!col) return [];
    let items = Array.from(col.values()).map(v => JSON.parse(JSON.stringify(v)));
    if (typeof filterPredicate === 'function') {
      items = items.filter(filterPredicate);
    }
    return items;
  }
}

/**
 * Dual-Source Data Service simulator: automatically falls back to bundled seed data on Firestore failure.
 */
export class ResilientDataService {
  constructor(firestore) {
    this.firestore = firestore;
  }

  async getProducts(filter = {}) {
    try {
      return await this.firestore.queryDocs('products', (p) => {
        if (filter.make) {
          const isUniversal = p.compatibility?.type === 'universal';
          const matchesMake = p.compatibility?.compatibleMakes?.some(
            m => m.toLowerCase() === filter.make.toLowerCase()
          );
          if (!isUniversal && !matchesMake) return false;
        }
        if (filter.categoryId && p.categoryId !== filter.categoryId) {
          return false;
        }
        if (filter.query) {
          const q = filter.query.toLowerCase().trim();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }
        return true;
      });
    } catch (err) {
      // Resilient Fallback to Seed Data
      let seed = JSON.parse(JSON.stringify(mockProducts));
      if (filter.make) {
        seed = seed.filter(p =>
          p.compatibility?.type === 'universal' ||
          p.compatibility?.compatibleMakes?.some(m => m.toLowerCase() === filter.make.toLowerCase())
        );
      }
      if (filter.categoryId) {
        seed = seed.filter(p => p.categoryId === filter.categoryId);
      }
      if (filter.query) {
        const q = filter.query.toLowerCase().trim();
        seed = seed.filter(p =>
          p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
      }
      return seed;
    }
  }

  async getProductById(id) {
    try {
      const prod = await this.firestore.getDoc('products', id);
      if (prod) return prod;
    } catch (err) {
      // Fallback
    }
    const seed = mockProducts.find(p => p.id === id);
    return seed ? JSON.parse(JSON.stringify(seed)) : null;
  }

  async getVehicles() {
    try {
      return await this.firestore.queryDocs('vehicles');
    } catch {
      return JSON.parse(JSON.stringify(mockVehicles));
    }
  }

  async getCategories() {
    try {
      return await this.firestore.queryDocs('categories');
    } catch {
      return JSON.parse(JSON.stringify(mockCategories));
    }
  }

  async getBanners() {
    try {
      return await this.firestore.queryDocs('banners');
    } catch {
      return JSON.parse(JSON.stringify(mockCarouselPosters));
    }
  }

  async getSettings() {
    try {
      const settings = await this.firestore.getDoc('settings', 'store');
      if (settings) return settings;
    } catch {}
    return { ...mockAdminSettings };
  }
}

/**
 * In-memory Mock Cloudflare R2 S3 Client.
 */
export class MockCloudflareR2Client {
  constructor() {
    this.storage = new Map();
  }

  async putObject({ Bucket, Key, Body, ContentType }) {
    if (!Bucket || Bucket !== ENV_CONFIG.cloudflareR2.bucketName) {
      throw new Error(`Invalid bucket name: ${Bucket}. Expected: ${ENV_CONFIG.cloudflareR2.bucketName}`);
    }
    if (!Key || typeof Key !== 'string') {
      throw new Error('PutObject requires a valid non-empty string Key');
    }
    if (!ContentType || !['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(ContentType)) {
      throw new Error(`Unsupported or invalid ContentType: ${ContentType}`);
    }
    if (!Body || (typeof Body !== 'string' && !Buffer.isBuffer(Body) && !(Body instanceof Uint8Array))) {
      throw new Error('Body cannot be empty or invalid');
    }

    const size = Buffer.isBuffer(Body) ? Body.length : typeof Body === 'string' ? Buffer.byteLength(Body) : Body.byteLength;
    this.storage.set(Key, {
      bucket: Bucket,
      key: Key,
      contentType: ContentType,
      size,
      uploadedAt: new Date().toISOString(),
    });

    const publicUrl = `${ENV_CONFIG.cloudflareR2.publicDevUrl}/${Key}`;
    return {
      success: true,
      key: Key,
      url: publicUrl,
      size,
    };
  }

  async getObject({ Bucket, Key }) {
    if (Bucket !== ENV_CONFIG.cloudflareR2.bucketName) {
      throw new Error('Invalid bucket');
    }
    if (!this.storage.has(Key)) {
      const err = new Error('NoSuchKey');
      err.code = 'NoSuchKey';
      throw err;
    }
    return this.storage.get(Key);
  }

  async deleteObject({ Bucket, Key }) {
    if (Bucket !== ENV_CONFIG.cloudflareR2.bucketName) {
      throw new Error('Invalid bucket');
    }
    this.storage.delete(Key);
    return { success: true };
  }

  async listObjects({ Bucket, Prefix = '' }) {
    if (Bucket !== ENV_CONFIG.cloudflareR2.bucketName) {
      throw new Error('Invalid bucket');
    }
    const results = [];
    for (const [key, meta] of this.storage.entries()) {
      if (key.startsWith(Prefix)) {
        results.push(meta);
      }
    }
    return results;
  }
}

/**
 * 3-Tier Vehicle Compatibility Calculation Engine Contract.
 * Specification from PROJECT.md:
 * 1. If product.compatibility.type === 'universal' -> compatible: true, reason: 'universal', label: 'Universal Fit'
 * 2. If selectedVehicle === null -> compatible: true, reason: 'select_vehicle', label: 'Select Vehicle to Check Fit'
 * 3. If product.compatibility.type === 'single' -> match on vehicleId
 * 4. If product.compatibility.type === 'multi' -> match on vehicleIds.includes(selectedVehicle.id) or compatibleMakes.includes(selectedVehicle.make)
 */
export function checkCompatibility(product, selectedVehicle) {
  if (!product || !product.compatibility) {
    return {
      compatible: false,
      reason: 'incompatible',
      label: 'Compatibility information unavailable',
    };
  }

  const { type, vehicleId, vehicleIds, compatibleMakes } = product.compatibility;

  // Rule 1: Universal Fitment
  if (type === 'universal') {
    return {
      compatible: true,
      reason: 'universal',
      label: 'Universal Fit',
    };
  }

  // Rule 2: Vehicle not yet selected
  if (!selectedVehicle) {
    return {
      compatible: true,
      reason: 'select_vehicle',
      label: 'Select Vehicle to Check Fit',
    };
  }

  // Rule 3: Single Vehicle Exact Fit
  if (type === 'single') {
    if (vehicleId && vehicleId === selectedVehicle.id) {
      return {
        compatible: true,
        reason: 'exact_match',
        label: `Direct Fit for ${selectedVehicle.model}`,
      };
    }
    return {
      compatible: false,
      reason: 'incompatible',
      label: `Does Not Fit ${selectedVehicle.model}`,
    };
  }

  // Rule 4: Multi Vehicle Fit
  if (type === 'multi') {
    const directMatch = Array.isArray(vehicleIds) && vehicleIds.includes(selectedVehicle.id);
    const makeMatch = Array.isArray(compatibleMakes) &&
      compatibleMakes.some(m => m.toLowerCase() === selectedVehicle.make?.toLowerCase());

    if (directMatch || makeMatch) {
      return {
        compatible: true,
        reason: 'multi_match',
        label: `Compatible with ${selectedVehicle.model}`,
      };
    }
    return {
      compatible: false,
      reason: 'incompatible',
      label: `Does Not Fit ${selectedVehicle.model}`,
    };
  }

  return {
    compatible: false,
    reason: 'incompatible',
    label: 'Incompatible Vehicle',
  };
}

/**
 * WhatsApp Order Hand-off Engine Contract.
 * Specification from PROJECT.md:
 * - Generates clean wa.me URL
 * - Sanitizes recipient phone number (digits only)
 * - Encodes message body with itemized items, shipping details, total
 * - Explicit payment disclaimer: "Note: Online payment is not collected on the website..."
 * - Reference ID formatted KRAV-XXXXX
 */
export function formatWhatsAppUrl(order, recipientPhone) {
  const rawPhone = recipientPhone || ENV_CONFIG.defaultWhatsAppNumber;
  const cleanPhone = String(rawPhone).replace(/[^\d]/g, '');

  const lines = [
    `*KRAVION AUTO — ORDER ENQUIRY*`,
    `Reference: ${order.orderNumber || order.id || 'KRAV-PENDING'}`,
    `Date: ${order.createdAt || new Date().toISOString()}`,
    ``,
    `*Customer Details:*`,
    `• Name: ${order.customerName}`,
    `• Phone: ${order.customerPhone}`,
    `• Email: ${order.customerEmail || 'N/A'}`,
  ];

  if (order.shippingAddress) {
    const addr = order.shippingAddress;
    lines.push(`• Shipping: ${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`);
  }

  if (order.vehicleDetails) {
    const v = order.vehicleDetails;
    lines.push(`• Vehicle: ${v.make} ${v.model} (${v.year || 'N/A'})`);
  }

  lines.push(``, `*Ordered Items:*`);
  if (Array.isArray(order.items)) {
    order.items.forEach((item, idx) => {
      const price = Number(item.price).toFixed(2);
      const subtotal = Number(item.subtotal || item.price * item.quantity).toFixed(2);
      lines.push(`${idx + 1}. ${item.title} (x${item.quantity}) - $${subtotal} ($${price} ea)`);
    });
  }

  lines.push(``);
  if (order.subtotal !== undefined) {
    lines.push(`Subtotal: $${Number(order.subtotal).toFixed(2)}`);
  }
  if (order.tax !== undefined) {
    lines.push(`Estimated Tax: $${Number(order.tax).toFixed(2)}`);
  }
  if (order.shipping !== undefined) {
    lines.push(`Shipping: ${Number(order.shipping) === 0 ? 'FREE' : `$${Number(order.shipping).toFixed(2)}`}`);
  }
  lines.push(`*Total Amount: $${Number(order.totalAmount).toFixed(2)}*`);

  if (order.notes) {
    lines.push(``, `Customer Notes: "${order.notes}"`);
  }

  lines.push(
    ``,
    `----------------------------------------`,
    `*IMPORTANT PAYMENT NOTICE:*`,
    `Online payment is not collected on the website. Kravion Auto will review your order enquiry and provide official payment confirmation and dispatch details directly via this chat.`
  );

  const fullMessage = lines.join('\n');
  const encodedMessage = encodeURIComponent(fullMessage);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Shopping Cart Totals Engine.
 */
export function calculateCartTotals(items, options = {}) {
  const freeThreshold = options.freeShippingThreshold ?? mockAdminSettings.freeShippingThreshold;
  const taxRate = (options.taxRatePercent ?? mockAdminSettings.taxRatePercent) / 100;
  const standardShipping = options.defaultShippingCost ?? mockAdminSettings.defaultShippingCost;

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.quantity);
  }, 0);

  const shipping = subtotal >= freeThreshold || items.length === 0 ? 0 : standardShipping;
  const tax = items.length === 0 ? 0 : Math.round(subtotal * taxRate * 100) / 100;
  const totalAmount = Math.round((subtotal + shipping + tax) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    tax,
    totalAmount,
    itemCount: items.reduce((count, item) => count + Number(item.quantity), 0),
  };
}

/**
 * In-memory Wishlist state manager.
 */
export class WishlistManager {
  constructor() {
    this.items = new Set();
  }

  addItem(productId) {
    if (!productId) throw new Error('productId is required');
    this.items.add(productId);
    return Array.from(this.items);
  }

  removeItem(productId) {
    this.items.delete(productId);
    return Array.from(this.items);
  }

  hasItem(productId) {
    return this.items.has(productId);
  }

  getCount() {
    return this.items.size;
  }

  getItems() {
    return Array.from(this.items);
  }

  clear() {
    this.items.clear();
  }
}

/**
 * Auth Guard simulator.
 */
export function checkAuthGuard(userSession, requestedRoute) {
  const protectedRoutes = ['/checkout', '/account', '/wishlist', '/admin'];
  const isAdminRoute = requestedRoute.startsWith('/admin');
  const isProtected = protectedRoutes.some(route => requestedRoute.startsWith(route));

  if (!isProtected) {
    return { allowed: true, redirectUrl: null };
  }

  if (!userSession) {
    return {
      allowed: false,
      redirectUrl: `/login?redirect=${encodeURIComponent(requestedRoute)}`,
      reason: 'unauthenticated',
    };
  }

  if (isAdminRoute && userSession.role !== 'admin') {
    return {
      allowed: false,
      redirectUrl: '/unauthorized',
      reason: 'forbidden_non_admin',
    };
  }

  return { allowed: true, redirectUrl: null };
}
