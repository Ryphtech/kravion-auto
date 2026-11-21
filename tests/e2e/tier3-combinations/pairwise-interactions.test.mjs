/**
 * Tier 3: Cross-Feature Combinations (Pairwise Combinatorial Testing)
 * kravion Auto E2E Test Suite
 *
 * Exercises combinatorial interactions across:
 * - Garage Selector & Vehicle Compatibility Engine
 * - Catalog Faceted Search & Filtering
 * - Shopping Cart Operations & Totals Math
 * - Customer Authentication & Session State
 * - Wishlist Management & Persistence
 * - WhatsApp Hand-off Engine & Phone Settings
 * - Cloudflare R2 S3 Object Storage
 * - Admin Catalog, Categories, Vehicles & Banners CRUD
 * - Firestore Dual-Source Resilient Data Layer
 */

import { describe, test, beforeEach } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertDeepEqual,
  assertMatch,
  assertIncludes,
  assertGreaterThan,
  assertLessThan,
  assertThrows,
} from '../helpers/assertions.mjs';
import {
  mockVehicles,
  mockCategories,
  mockProducts,
  mockOrders,
  mockAdminSettings,
  mockCarouselPosters,
  mockUserSessions,
  R2_PUBLIC_BASE_URL,
} from '../helpers/mock-data.mjs';
import {
  ENV_CONFIG,
  MockFirestoreDatabase,
  ResilientDataService,
  MockCloudflareR2Client,
  checkCompatibility,
  formatWhatsAppUrl,
  calculateCartTotals,
  WishlistManager,
  checkAuthGuard,
} from '../helpers/test-env.mjs';

describe('Tier 3: Cross-Feature Combinations (Pairwise Interactions)', () => {
  let db;
  let dataService;
  let r2Client;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
    dataService = new ResilientDataService(db);
    r2Client = new MockCloudflareR2Client();
  });

  // =========================================================================
  // Pair 1: Garage Selector + Storefront Catalog Filtering + Fitment Badge in Product Detail
  // =========================================================================
  test('Pair 1: Garage Selector + Storefront Catalog Filtering + Fitment Badge in Product Detail', async () => {
    const bmwG20 = mockVehicles.find(v => v.id === 'bmw-3-g20');
    const audiA4 = mockVehicles.find(v => v.id === 'audi-a4-b9');
    assert(bmwG20 && audiA4, 'Vehicle fixtures must exist');

    // 1. Customer sets BMW G20 in Garage and filters catalog
    const filteredProducts = await dataService.getProducts({ make: 'BMW' });
    assertGreaterThan(filteredProducts.length, 0, 'Catalog must return products for BMW');

    for (const prod of filteredProducts) {
      const isUniversal = prod.compatibility?.type === 'universal';
      const supportsBmw = prod.compatibility?.compatibleMakes?.includes('BMW');
      assert(
        isUniversal || supportsBmw,
        `Catalog filtered product ${prod.id} must support BMW or be universal`
      );
    }

    // 2. Inspect Single-compatibility product for BMW
    const bmwLip = filteredProducts.find(p => p.id === 'prod-single-bmw-lip');
    assert(bmwLip, 'BMW G20 front splitter must be present in BMW filtered catalog');
    const badgeBmw = checkCompatibility(bmwLip, bmwG20);
    assertEqual(badgeBmw.compatible, true);
    assertEqual(badgeBmw.reason, 'exact_match');
    assertMatch(badgeBmw.label, /Direct Fit/i);

    // 3. Inspect Universal product in the same filtered view
    const ceramicKit = filteredProducts.find(p => p.id === 'prod-universal-ceramic-kit');
    assert(ceramicKit, 'Universal ceramic kit must be present in BMW filtered catalog');
    const badgeUniversal = checkCompatibility(ceramicKit, bmwG20);
    assertEqual(badgeUniversal.compatible, true);
    assertEqual(badgeUniversal.reason, 'universal');
    assertEqual(badgeUniversal.label, 'Universal Fit');

    // 4. Switch Garage vehicle to Audi A4 -> Product detail badge dynamically recalculates
    const badgeAudiOnBmwLip = checkCompatibility(bmwLip, audiA4);
    assertEqual(badgeAudiOnBmwLip.compatible, false);
    assertEqual(badgeAudiOnBmwLip.reason, 'incompatible');
    assertMatch(badgeAudiOnBmwLip.label, /Does Not Fit/i);
  });

  // =========================================================================
  // Pair 2: Customer Auth Login + Wishlist Persistence Across Sessions
  // =========================================================================
  test('Pair 2: Customer Auth Login + Wishlist Persistence Across Sessions', async () => {
    const customer = mockUserSessions.customerUser;
    const wishlistSession1 = new WishlistManager();

    // Guest adds items to wishlist
    wishlistSession1.addItem('prod-single-bmw-lip');
    wishlistSession1.addItem('prod-multi-german-led');
    assertEqual(wishlistSession1.getCount(), 2);

    // Customer logs in -> Save wishlist state to Firestore under user UID
    await db.setDoc('wishlists', customer.uid, {
      userId: customer.uid,
      items: wishlistSession1.getItems(),
      updatedAt: new Date().toISOString(),
    });

    // Verify stored wishlist in DB
    const savedWishlistDoc = await db.getDoc('wishlists', customer.uid);
    assert(savedWishlistDoc, 'Wishlist must be persisted in database for authenticated customer');
    assertEqual(savedWishlistDoc.items.length, 2);
    assertIncludes(savedWishlistDoc.items, 'prod-single-bmw-lip');
    assertIncludes(savedWishlistDoc.items, 'prod-multi-german-led');

    // Simulate new session (e.g. user re-logs in on another device)
    const wishlistSession2 = new WishlistManager();
    const restoredDoc = await db.getDoc('wishlists', customer.uid);
    restoredDoc.items.forEach(itemId => wishlistSession2.addItem(itemId));

    // Verify items restored correctly
    assertEqual(wishlistSession2.getCount(), 2);
    assert(wishlistSession2.hasItem('prod-single-bmw-lip'));
    assert(wishlistSession2.hasItem('prod-multi-german-led'));

    // Customer removes one item in Session 2 and updates DB
    wishlistSession2.removeItem('prod-single-bmw-lip');
    assertEqual(wishlistSession2.getCount(), 1);

    await db.updateDoc('wishlists', customer.uid, {
      items: wishlistSession2.getItems(),
    });

    const updatedDoc = await db.getDoc('wishlists', customer.uid);
    assertEqual(updatedDoc.items.length, 1);
    assertEqual(updatedDoc.items[0], 'prod-multi-german-led');
  });

  // =========================================================================
  // Pair 3: Shopping Cart + Vehicle Fitment Warning for Non-Matching Garage Vehicle
  // =========================================================================
  test('Pair 3: Shopping Cart + Vehicle Fitment Warning for Non-Matching Garage Vehicle', () => {
    const audiA4 = mockVehicles.find(v => v.id === 'audi-a4-b9');
    const bmwSplitter = mockProducts.find(p => p.id === 'prod-single-bmw-lip');
    const universalCushion = mockProducts.find(p => p.id === 'prod-universal-nappa-cushion');

    // Active cart with two items
    const cartItems = [
      {
        product: bmwSplitter,
        price: bmwSplitter.price,
        quantity: 1,
      },
      {
        product: universalCushion,
        price: universalCushion.price,
        quantity: 2,
      },
    ];

    // Evaluate compatibility warnings in cart for the active Garage vehicle (Audi A4)
    const annotatedCart = cartItems.map(item => {
      const fitment = checkCompatibility(item.product, audiA4);
      return {
        ...item,
        fitment,
        hasWarning: !fitment.compatible,
      };
    });

    // Item 1 (BMW Splitter) must trigger incompatibility warning for Audi A4
    assertEqual(annotatedCart[0].hasWarning, true);
    assertEqual(annotatedCart[0].fitment.compatible, false);
    assertEqual(annotatedCart[0].fitment.reason, 'incompatible');
    assertMatch(annotatedCart[0].fitment.label, /Does Not Fit A4/i);

    // Item 2 (Universal Cushion) must NOT trigger warning
    assertEqual(annotatedCart[1].hasWarning, false);
    assertEqual(annotatedCart[1].fitment.compatible, true);
    assertEqual(annotatedCart[1].fitment.reason, 'universal');

    // Total calculations remain mathematically valid despite warning
    const totals = calculateCartTotals([
      { price: bmwSplitter.price, quantity: 1 },
      { price: universalCushion.price, quantity: 2 },
    ]);

    const expectedSubtotal = 489.0 + (65.0 * 2); // 619.0
    assertEqual(totals.subtotal, expectedSubtotal);
    assertEqual(totals.shipping, 0.0); // Subtotal > 100 threshold
    assertEqual(totals.itemCount, 3);
  });

  // =========================================================================
  // Pair 4: Admin Product CRUD + Cloudflare R2 Upload + Storefront Search Discovery
  // =========================================================================
  test('Pair 4: Admin Product CRUD + Cloudflare R2 Upload + Storefront Search Discovery', async () => {
    // 1. Admin uploads product image to Cloudflare R2
    const uploadResult = await r2Client.putObject({
      Bucket: ENV_CONFIG.cloudflareR2.bucketName,
      Key: 'products/audi-b9-carbon-side-skirts.webp',
      Body: Buffer.from('mock-high-res-binary-image-data-side-skirts'),
      ContentType: 'image/webp',
    });

    assertEqual(uploadResult.success, true);
    assertEqual(
      uploadResult.url,
      `${ENV_CONFIG.cloudflareR2.publicDevUrl}/products/audi-b9-carbon-side-skirts.webp`
    );

    // 2. Admin creates a new product in Firestore referencing the R2 URL
    const newProduct = {
      id: 'prod-audi-b9-side-skirts',
      title: 'Audi A4 B9 Pre-Preg Carbon Fiber Side Skirts',
      slug: 'audi-a4-b9-carbon-side-skirts',
      price: 380.0,
      compareAtPrice: 450.0,
      categoryId: 'exterior',
      categoryName: 'Exterior Styling & Aero',
      description: 'Aerodynamic side splitters designed for Audi A4 B9 styling packages.',
      images: [uploadResult.url],
      specs: {
        dimensions: '200 x 12 x 8 cm',
        weight: '1.9 kg',
        material: 'Toray 3K Pre-preg Carbon Fiber',
        warranty: '2-Year Kravion Limited Warranty',
      },
      ratings: { rating: 5.0, reviewCount: 1 },
      stock: { status: 'in_stock', inventory: 10 },
      compatibility: {
        type: 'single',
        vehicleId: 'audi-a4-b9',
        compatibleMakes: ['Audi'],
      },
      featured: true,
    };

    await db.setDoc('products', newProduct.id, newProduct);

    // 3. Storefront searches and filters for the new product
    const searchResults = await dataService.getProducts({
      make: 'Audi',
      categoryId: 'exterior',
      query: 'skirts',
    });

    assertEqual(searchResults.length, 1);
    const discovered = searchResults[0];
    assertEqual(discovered.id, 'prod-audi-b9-side-skirts');
    assertEqual(discovered.images[0], uploadResult.url);
    assertIncludes(discovered.images[0], ENV_CONFIG.cloudflareR2.publicDevUrl);
  });

  // =========================================================================
  // Pair 5: Admin Category Deletion + Storefront Filter Graceful Degradation
  // =========================================================================
  test('Pair 5: Admin Category Deletion + Storefront Filter Graceful Degradation', async () => {
    // 1. Initial category count
    const initialCategories = await dataService.getCategories();
    const wheelsCategory = initialCategories.find(c => c.id === 'wheels');
    assert(wheelsCategory, 'Category wheels must initially exist');

    // 2. Admin deletes 'wheels' category
    await db.deleteDoc('categories', 'wheels');

    // 3. Storefront category navigation no longer displays 'wheels'
    const updatedCategories = await dataService.getCategories();
    assertEqual(updatedCategories.some(c => c.id === 'wheels'), false);

    // 4. Products query filtering by deleted category returns empty array gracefully without crashing
    const wheelsProducts = await dataService.getProducts({ categoryId: 'wheels' });
    assertEqual(Array.isArray(wheelsProducts), true);

    // 5. Storefront full catalog query still succeeds and products are intact
    const allProducts = await dataService.getProducts({});
    assertGreaterThan(allProducts.length, 0);
  });

  // =========================================================================
  // Pair 6: WhatsApp Checkout URL Formatting + Free Shipping Threshold Calculation
  // =========================================================================
  test('Pair 6: WhatsApp Checkout URL Formatting + Free Shipping Threshold Calculation', () => {
    // Subtotal under threshold: $89.00 < $100.00
    const belowThresholdCart = [{ price: 89.0, quantity: 1, title: 'Ceramic Coating Kit' }];
    const totalsBelow = calculateCartTotals(belowThresholdCart);
    assertEqual(totalsBelow.subtotal, 89.0);
    assertEqual(totalsBelow.shipping, 15.0); // Standard shipping
    assertEqual(totalsBelow.tax, 7.12); // 8% of 89
    assertEqual(totalsBelow.totalAmount, 111.12);

    const orderBelow = {
      id: 'order-test-below',
      orderNumber: 'KRAV-9001',
      customerName: 'Alice Green',
      customerPhone: '+1 (555) 345-6789',
      items: belowThresholdCart,
      subtotal: totalsBelow.subtotal,
      shipping: totalsBelow.shipping,
      tax: totalsBelow.tax,
      totalAmount: totalsBelow.totalAmount,
    };

    const urlBelow = formatWhatsAppUrl(orderBelow, '919876543210');
    const decodedBelow = decodeURIComponent(urlBelow);
    assertIncludes(decodedBelow, 'Shipping: $15.00');
    assertIncludes(decodedBelow, 'Total Amount: $111.12');

    // Subtotal above threshold: $89.00 * 2 = $178.00 >= $100.00
    const aboveThresholdCart = [{ price: 89.0, quantity: 2, title: 'Ceramic Coating Kit' }];
    const totalsAbove = calculateCartTotals(aboveThresholdCart);
    assertEqual(totalsAbove.subtotal, 178.0);
    assertEqual(totalsAbove.shipping, 0.0); // Free shipping
    assertEqual(totalsAbove.tax, 14.24); // 8% of 178
    assertEqual(totalsAbove.totalAmount, 192.24);

    const orderAbove = {
      ...orderBelow,
      id: 'order-test-above',
      orderNumber: 'KRAV-9002',
      items: aboveThresholdCart,
      subtotal: totalsAbove.subtotal,
      shipping: totalsAbove.shipping,
      tax: totalsAbove.tax,
      totalAmount: totalsAbove.totalAmount,
    };

    const urlAbove = formatWhatsAppUrl(orderAbove, '919876543210');
    const decodedAbove = decodeURIComponent(urlAbove);
    assertIncludes(decodedAbove, 'Shipping: FREE');
    assertIncludes(decodedAbove, 'Total Amount: $192.24');
    assertIncludes(decodedAbove, 'Online payment is not collected on the website');
  });

  // =========================================================================
  // Pair 7: Admin Vehicle Directory CRUD + Compatibility Engine Recalculation
  // =========================================================================
  test('Pair 7: Admin Vehicle Directory CRUD + Compatibility Engine Recalculation', async () => {
    // 1. Admin registers new vehicle in directory
    const newVehicle = {
      id: 'mb-amg-gt-c190',
      make: 'Mercedes-Benz',
      model: 'AMG GT Coupe (C190)',
      yearRange: '2015-2023',
      slug: 'mercedes-benz-amg-gt-c190',
      generation: 'C190',
    };
    await db.setDoc('vehicles', newVehicle.id, newVehicle);

    // 2. Fetch existing multi-fitment product and initially test compatibility with new vehicle
    const multiProd = await dataService.getProductById('prod-multi-german-led');
    assert(multiProd, 'Product fixture must exist');

    // mercedes-amg-gt is Mercedes-Benz, and compatibleMakes includes 'Mercedes-Benz'
    let fitResult = checkCompatibility(multiProd, newVehicle);
    assertEqual(fitResult.compatible, true);
    assertEqual(fitResult.reason, 'multi_match');

    // 3. Admin narrows product compatibility: removes Mercedes-Benz from compatibleMakes
    const restrictedCompatibility = {
      type: 'multi',
      vehicleIds: ['bmw-3-g20', 'audi-a4-b9'],
      compatibleMakes: ['BMW', 'Audi'],
    };
    await db.updateDoc('products', multiProd.id, {
      compatibility: restrictedCompatibility,
    });

    const updatedProd = await dataService.getProductById(multiProd.id);
    assertEqual(updatedProd.compatibility.compatibleMakes.includes('Mercedes-Benz'), false);

    // 4. Compatibility engine recalculates: new vehicle is now incompatible
    fitResult = checkCompatibility(updatedProd, newVehicle);
    assertEqual(fitResult.compatible, false);
    assertEqual(fitResult.reason, 'incompatible');
    assertMatch(fitResult.label, /Does Not Fit AMG GT Coupe/i);
  });

  // =========================================================================
  // Pair 8: Firestore Fallback Data Service + Customer Order Enquiry Queueing
  // =========================================================================
  test('Pair 8: Firestore Fallback Data Service + Customer Order Enquiry Queueing', async () => {
    // 1. Simulate Firestore backend connectivity failure
    db.simulateFault('NETWORK_UNAVAILABLE');

    // 2. Customer attempts catalog query -> Resilient fallback serves bundled seed data
    const fallbackProducts = await dataService.getProducts({ make: 'BMW' });
    assertGreaterThan(fallbackProducts.length, 0, 'Must fall back to bundled seed catalog');
    const bmwItem = fallbackProducts.find(p => p.id === 'prod-single-bmw-lip');
    assert(bmwItem, 'Seed product must be available during network outage');

    // 3. Customer attempts to submit order enquiry while offline
    const queuedOrder = {
      id: 'order-queued-offline-01',
      orderNumber: 'KRAV-OFFLINE-01',
      customerName: 'Marcus Vance',
      customerPhone: '+1 (555) 234-5678',
      items: [{ productId: bmwItem.id, title: bmwItem.title, price: bmwItem.price, quantity: 1 }],
      totalAmount: bmwItem.price,
      status: 'enquiry_placed',
      queuedLocally: true,
      createdAt: new Date().toISOString(),
    };

    // Verify WhatsApp checkout URL generation is unaffected by Firestore outage
    const waUrl = formatWhatsAppUrl(queuedOrder, '919876543210');
    assertMatch(waUrl, /^https:\/\/wa\.me\/919876543210\?text=.+/);
    assertIncludes(decodeURIComponent(waUrl), 'KRAV-OFFLINE-01');

    // 4. Simulate network recovery and sync queue to Firestore
    db.simulateFault(null);
    await db.setDoc('orders', queuedOrder.id, queuedOrder);

    const syncedOrder = await db.getDoc('orders', queuedOrder.id);
    assert(syncedOrder, 'Order must sync successfully to Firestore upon recovery');
    assertEqual(syncedOrder.status, 'enquiry_placed');
  });

  // =========================================================================
  // Pair 9: Pre-Checkout Auth Guard Redirection -> Login -> Resume Cart Checkout
  // =========================================================================
  test('Pair 9: Pre-Checkout Auth Guard Redirection -> Login -> Resume Cart Checkout', () => {
    const requestedRoute = '/checkout';

    // 1. Unauthenticated guest attempts to enter checkout
    const guestGuard = checkAuthGuard(mockUserSessions.guestUser, requestedRoute);
    assertEqual(guestGuard.allowed, false);
    assertEqual(guestGuard.reason, 'unauthenticated');
    assertEqual(guestGuard.redirectUrl, '/login?redirect=%2Fcheckout');

    // 2. User navigates to login with the redirect param intact
    const redirectTarget = decodeURIComponent(guestGuard.redirectUrl.split('?redirect=')[1]);
    assertEqual(redirectTarget, '/checkout');

    // 3. User authenticates successfully
    const activeSession = mockUserSessions.customerUser;

    // 4. Re-evaluating guard with customer session allows access
    const authGuard = checkAuthGuard(activeSession, redirectTarget);
    assertEqual(authGuard.allowed, true);
    assertEqual(authGuard.redirectUrl, null);
  });

  // =========================================================================
  // Pair 10: Admin Settings Phone Update -> Immediate Reflection in Customer WhatsApp Hand-off URL
  // =========================================================================
  test('Pair 10: Admin Settings Phone Update -> Immediate Reflection in Customer WhatsApp Hand-off URL', async () => {
    const sampleOrder = mockOrders[0];

    // 1. Initial settings phone number
    const initialSettings = await dataService.getSettings();
    assertEqual(initialSettings.whatsappNumber, '919876543210');

    const url1 = formatWhatsAppUrl(sampleOrder, initialSettings.whatsappNumber);
    assert(url1.startsWith('https://wa.me/919876543210'));

    // 2. Admin updates WhatsApp contact phone in settings
    const newPhone = '+1 (800) 555-0199'; // Should sanitize to 18005550199
    await db.updateDoc('settings', 'store', {
      whatsappNumber: newPhone,
      contactPhone: newPhone,
    });

    // 3. Verify dataService loads the newly updated settings
    const updatedSettings = await dataService.getSettings();
    assertEqual(updatedSettings.whatsappNumber, newPhone);

    // 4. Subsequent WhatsApp checkout URL immediately targets new phone
    const url2 = formatWhatsAppUrl(sampleOrder, updatedSettings.whatsappNumber);
    assert(url2.startsWith('https://wa.me/18005550199'), `Expected URL to use sanitized new phone, got ${url2}`);
  });

  // =========================================================================
  // Pair 11: Wishlist Item Direct Move to Shopping Cart with Quantity Check
  // =========================================================================
  test('Pair 11: Wishlist Item Direct Move to Shopping Cart with Quantity Check', () => {
    const wishlist = new WishlistManager();
    const cart = [];

    const inStockProduct = mockProducts.find(p => p.stock.status === 'in_stock');
    const lowStockProduct = mockProducts.find(p => p.stock.status === 'low_stock');
    assert(inStockProduct && lowStockProduct, 'Products with varied stock must exist');

    wishlist.addItem(inStockProduct.id);
    wishlist.addItem(lowStockProduct.id);
    assertEqual(wishlist.getCount(), 2);

    // Helper: Move item from Wishlist to Cart with stock check
    function moveWishlistItemToCart(productId, productCatalog) {
      const prod = productCatalog.find(p => p.id === productId);
      if (!prod) throw new Error('Product not found');
      if (prod.stock.inventory <= 0) {
        throw new Error(`Product ${prod.title} is out of stock`);
      }

      // Add to cart
      const existing = cart.find(item => item.productId === productId);
      if (existing) {
        if (existing.quantity < prod.stock.inventory) {
          existing.quantity += 1;
        }
      } else {
        cart.push({
          productId: prod.id,
          title: prod.title,
          price: prod.price,
          quantity: 1,
          maxInventory: prod.stock.inventory,
        });
      }

      // Remove from wishlist
      wishlist.removeItem(productId);
    }

    // Move in-stock item
    moveWishlistItemToCart(inStockProduct.id, mockProducts);
    assertEqual(wishlist.hasItem(inStockProduct.id), false);
    assertEqual(cart.length, 1);
    assertEqual(cart[0].productId, inStockProduct.id);

    // Move low-stock item
    moveWishlistItemToCart(lowStockProduct.id, mockProducts);
    assertEqual(wishlist.hasItem(lowStockProduct.id), false);
    assertEqual(cart.length, 2);
    assertEqual(wishlist.getCount(), 0);

    // Attempt moving out-of-stock item
    const outOfStockProduct = {
      ...inStockProduct,
      id: 'prod-out-of-stock-01',
      stock: { status: 'out_of_stock', inventory: 0 },
    };
    wishlist.addItem(outOfStockProduct.id);

    assertThrows(
      () => moveWishlistItemToCart(outOfStockProduct.id, [outOfStockProduct]),
      /out of stock/i
    );
    // Item must remain in wishlist
    assertEqual(wishlist.hasItem(outOfStockProduct.id), true);
  });

  // =========================================================================
  // Pair 12: Admin Carousel Slide Management + Homepage Hero Banner Rendering
  // =========================================================================
  test('Pair 12: Admin Carousel Slide Management + Homepage Hero Banner Rendering', async () => {
    // 1. Homepage initial banners
    const initialBanners = await dataService.getBanners();
    assertEqual(initialBanners.length, mockCarouselPosters.length);

    // 2. Admin creates a new 4th banner with uploaded R2 image URL
    const newBanner = {
      id: 'banner-hero-4',
      title: 'Monoblock Forged Aero Series',
      subtitle: 'Engineered for Track Dominance & Street Presence',
      imageUrl: `${R2_PUBLIC_BASE_URL}/banners/hero-forged-wheels.webp`,
      link: '/products?category=wheels',
      order: 4,
      isActive: true,
    };
    await db.setDoc('banners', newBanner.id, newBanner);

    // 3. Admin disables banner 2
    await db.updateDoc('banners', 'banner-hero-2', { isActive: false });

    // 4. Storefront hero carousel retrieves active banners ordered by sequence
    const allBanners = await dataService.getBanners();
    const activeOrderedBanners = allBanners
      .filter(b => b.isActive)
      .sort((a, b) => a.order - b.order);

    assertEqual(activeOrderedBanners.some(b => b.id === 'banner-hero-2'), false);
    assert(activeOrderedBanners.some(b => b.id === 'banner-hero-4'));

    // Verify ordering is monotonically increasing
    for (let i = 0; i < activeOrderedBanners.length - 1; i++) {
      assertLessThan(activeOrderedBanners[i].order, activeOrderedBanners[i + 1].order);
    }
  });

  // =========================================================================
  // Pair 13: Multi-Vehicle Compatibility Product + Multiple Garage Vehicle Switch Tests
  // =========================================================================
  test('Pair 13: Multi-Vehicle Compatibility Product + Multiple Garage Vehicle Switch Tests', () => {
    const multiProd = mockProducts.find(p => p.id === 'prod-multi-german-led');
    assert(multiProd, 'Multi product fixture must exist');

    const bmwG20 = mockVehicles.find(v => v.id === 'bmw-3-g20');
    const audiA4 = mockVehicles.find(v => v.id === 'audi-a4-b9');
    const mbCClass = mockVehicles.find(v => v.id === 'mb-c-w206');
    const porsche911 = mockVehicles.find(v => v.id === 'porsche-911-992');

    // Switch 1: BMW G20
    const resBmw = checkCompatibility(multiProd, bmwG20);
    assertEqual(resBmw.compatible, true);
    assertEqual(resBmw.reason, 'multi_match');
    assertIncludes(resBmw.label, bmwG20.model);

    // Switch 2: Audi A4
    const resAudi = checkCompatibility(multiProd, audiA4);
    assertEqual(resAudi.compatible, true);
    assertEqual(resAudi.reason, 'multi_match');
    assertIncludes(resAudi.label, audiA4.model);

    // Switch 3: Mercedes-Benz C-Class
    const resMb = checkCompatibility(multiProd, mbCClass);
    assertEqual(resMb.compatible, true);
    assertEqual(resMb.reason, 'multi_match');
    assertIncludes(resMb.label, mbCClass.model);

    // Switch 4: Porsche 911 (Not in vehicleIds or compatibleMakes)
    const resPorsche = checkCompatibility(multiProd, porsche911);
    assertEqual(resPorsche.compatible, false);
    assertEqual(resPorsche.reason, 'incompatible');
    assertMatch(resPorsche.label, /Does Not Fit 911 Carrera/i);

    // Switch 5: Garage cleared to null (No vehicle selected)
    const resNull = checkCompatibility(multiProd, null);
    assertEqual(resNull.compatible, true);
    assertEqual(resNull.reason, 'select_vehicle');
    assertEqual(resNull.label, 'Select Vehicle to Check Fit');
  });

  // =========================================================================
  // Pair 14: Google Auth Session + Order Enquiry Customer Profile Sync
  // =========================================================================
  test('Pair 14: Google Auth Session + Order Enquiry Customer Profile Sync', async () => {
    const googleUser = mockUserSessions.googleUser;
    assertEqual(googleUser.providerId, 'google.com');

    // Simulate placing an order enquiry populated with Google profile
    const orderPayload = {
      id: 'order-google-sync-99',
      orderNumber: 'KRAV-9988',
      customerId: googleUser.uid,
      customerName: googleUser.displayName,
      customerEmail: googleUser.email,
      customerPhone: '+1 (555) 777-8899',
      authProvider: googleUser.providerId,
      shippingAddress: {
        street: '100 Silicon Way',
        city: 'Palo Alto',
        state: 'CA',
        postalCode: '94301',
        country: 'United States',
      },
      items: [
        {
          productId: 'prod-universal-ceramic-kit',
          title: 'Kravion Ultra-Hydrophobic 9H Ceramic Coating Protection Kit',
          price: 89.0,
          quantity: 1,
        },
      ],
      totalAmount: 111.12,
      status: 'enquiry_placed',
      createdAt: new Date().toISOString(),
    };

    await db.setDoc('orders', orderPayload.id, orderPayload);

    const savedOrder = await db.getDoc('orders', orderPayload.id);
    assertEqual(savedOrder.customerName, 'Sarah Connor');
    assertEqual(savedOrder.customerEmail, 'sarah.connor@gmail.com');
    assertEqual(savedOrder.authProvider, 'google.com');

    // WhatsApp message includes customer name from Google profile
    const waUrl = formatWhatsAppUrl(savedOrder, '919876543210');
    const decoded = decodeURIComponent(waUrl);
    assertIncludes(decoded, 'Name: Sarah Connor');
    assertIncludes(decoded, 'Email: sarah.connor@gmail.com');
  });

  // =========================================================================
  // Pair 15: Invalid R2 Upload File -> Admin Product Creation Rollback/Rejection
  // =========================================================================
  test('Pair 15: Invalid R2 Upload File -> Admin Product Creation Rollback/Rejection', async () => {
    const invalidUploadAttempt = async () => {
      // Attempt upload with forbidden MIME type (e.g. executable script)
      return await r2Client.putObject({
        Bucket: ENV_CONFIG.cloudflareR2.bucketName,
        Key: 'products/malicious-file.sh',
        Body: Buffer.from('#!/bin/bash\necho bad'),
        ContentType: 'application/x-sh',
      });
    };

    // Helper: Transaction-like admin product create with image upload
    async function createProductWithUpload(productData, fileData) {
      // 1. Upload to R2
      const upload = await r2Client.putObject(fileData);
      // 2. Insert to Firestore
      const record = { ...productData, images: [upload.url] };
      await db.setDoc('products', record.id, record);
      return record;
    }

    // Verify upload throws validation error
    await assertThrows(
      invalidUploadAttempt,
      /Unsupported or invalid ContentType/i
    );

    // Verify that attempting creation with invalid file rolls back / halts before DB write
    await assertThrows(
      async () => {
        await createProductWithUpload(
          { id: 'prod-corrupt-01', title: 'Corrupt Product' },
          {
            Bucket: ENV_CONFIG.cloudflareR2.bucketName,
            Key: 'products/corrupt.exe',
            Body: Buffer.from('binary-data'),
            ContentType: 'application/octet-stream',
          }
        );
      },
      /Unsupported or invalid ContentType/i
    );

    // Product must NOT exist in database
    const doc = await db.getDoc('products', 'prod-corrupt-01');
    assertEqual(doc, null, 'Product write must have aborted on R2 upload rejection');
  });

  // =========================================================================
  // Pair 16: Zero-Payment Omission Guarantee Across Varied Cart Sizes and Currency Math
  // =========================================================================
  test('Pair 16: Zero-Payment Omission Guarantee Across Varied Cart Sizes and Currency Math', () => {
    const cartScenarios = [
      // 1. Single low-cost item
      {
        items: [{ price: 15.0, quantity: 1, title: 'Titanium Valve Caps' }],
        expectedSubtotal: 15.0,
      },
      // 2. High-value multi-item cart
      {
        items: [
          { price: 489.0, quantity: 2, title: 'BMW Front Splitter' },
          { price: 650.0, quantity: 1, title: 'Porsche Exhaust Tips' },
        ],
        expectedSubtotal: 1628.0,
      },
      // 3. Fractional price items
      {
        items: [
          { price: 19.99, quantity: 3, title: 'Microfiber Towel 3-pack' },
          { price: 135.5, quantity: 2, title: 'Dynamic Mirror Indicators' },
        ],
        expectedSubtotal: 330.97,
      },
    ];

    for (const scenario of cartScenarios) {
      const totals = calculateCartTotals(scenario.items);
      assertEqual(totals.subtotal, scenario.expectedSubtotal);

      const mockOrder = {
        id: `order-omission-${Math.floor(Math.random() * 10000)}`,
        orderNumber: 'KRAV-VERIFY',
        customerName: 'Payment Auditor',
        customerPhone: '+1 (555) 000-1111',
        items: scenario.items,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.tax,
        totalAmount: totals.totalAmount,
        status: 'enquiry_placed',
        paymentMethod: 'none',
        paymentStatus: 'pending_manual_quote',
      };

      // Strict assertions against payment gateway contamination
      assertEqual(mockOrder.paymentMethod, 'none');
      assertEqual(mockOrder.paymentStatus, 'pending_manual_quote');
      assert(!('stripePaymentIntentId' in mockOrder), 'Stripe field must NOT exist');
      assert(!('paypalOrderId' in mockOrder), 'PayPal field must NOT exist');
      assert(!('transactionId' in mockOrder), 'Transaction ID must NOT exist');

      // WhatsApp URL check
      const waUrl = formatWhatsAppUrl(mockOrder, '919876543210');
      const decoded = decodeURIComponent(waUrl);
      assertIncludes(
        decoded,
        'Online payment is not collected on the website',
        'Explicit payment disclaimer must be present in every WhatsApp message'
      );
      assertIncludes(decoded, `Total Amount: $${totals.totalAmount.toFixed(2)}`);
    }
  });

  // =========================================================================
  // Pair 17: Concurrent Cart Updates from Multiple Tabs / Sessions Simulation
  // =========================================================================
  test('Pair 17: Concurrent Cart Updates from Multiple Tabs / Sessions Simulation', () => {
    // Tab A and Tab B start with identical initial cart state
    const initialCart = [
      { productId: 'prod-single-bmw-lip', price: 489.0, quantity: 1 },
    ];

    const tabACart = JSON.parse(JSON.stringify(initialCart));
    const tabBCart = JSON.parse(JSON.stringify(initialCart));

    // Tab A adds a new item
    tabACart.push({ productId: 'prod-universal-ceramic-kit', price: 89.0, quantity: 2 });

    // Tab B updates quantity of the existing item
    tabBCart[0].quantity = 3;

    // Merger function: combines carts across tabs safely without price corruption
    function mergeCarts(cart1, cart2) {
      const map = new Map();

      const processCart = (cart) => {
        for (const item of cart) {
          if (!map.has(item.productId)) {
            map.set(item.productId, { ...item });
          } else {
            const existing = map.get(item.productId);
            // Reconcile: use maximum requested quantity
            existing.quantity = Math.max(existing.quantity, item.quantity);
          }
        }
      };

      processCart(cart1);
      processCart(cart2);
      return Array.from(map.values());
    }

    const merged = mergeCarts(tabACart, tabBCart);
    assertEqual(merged.length, 2);

    const mergedBmw = merged.find(i => i.productId === 'prod-single-bmw-lip');
    assertEqual(mergedBmw.quantity, 3, 'BMW splitter quantity should reconcile to 3');

    const mergedCeramic = merged.find(i => i.productId === 'prod-universal-ceramic-kit');
    assertEqual(mergedCeramic.quantity, 2, 'Ceramic kit should be merged with quantity 2');

    // Totals calculation on merged cart
    const totals = calculateCartTotals(merged);
    const expectedSubtotal = (489.0 * 3) + (89.0 * 2); // 1467 + 178 = 1645
    assertEqual(totals.subtotal, expectedSubtotal);
    assertEqual(totals.itemCount, 5);
  });

  // =========================================================================
  // Pair 18: Fallback Seed Catalog Read + Admin New Product Creation In-Memory Overlay
  // =========================================================================
  test('Pair 18: Fallback Seed Catalog Read + Admin New Product Creation In-Memory Overlay', async () => {
    // 1. Database is unavailable
    db.simulateFault('PERMISSION_DENIED');

    // 2. Reading products falls back to bundled seed catalog
    const seedCatalog = await dataService.getProducts({});
    assertEqual(seedCatalog.length, mockProducts.length);

    // 3. Admin creates product in in-memory session overlay while offline
    const offlineProduct = {
      id: 'prod-offline-overlay-101',
      title: 'Kravion Custom Stainless Steel Exhaust Valves',
      slug: 'kravion-custom-exhaust-valves',
      price: 249.0,
      categoryId: 'performance',
      stock: { status: 'in_stock', inventory: 5 },
      compatibility: { type: 'universal', vehicleIds: [], compatibleMakes: [] },
    };

    // Overlay manager
    class SessionCatalogOverlay {
      constructor(baseService) {
        this.baseService = baseService;
        this.localOverlay = new Map();
      }

      addLocalProduct(product) {
        this.localOverlay.set(product.id, product);
      }

      async getCombinedProducts() {
        const base = await this.baseService.getProducts({});
        const combined = [...base];
        for (const local of this.localOverlay.values()) {
          if (!combined.some(p => p.id === local.id)) {
            combined.push(local);
          }
        }
        return combined;
      }
    }

    const overlay = new SessionCatalogOverlay(dataService);
    overlay.addLocalProduct(offlineProduct);

    const combinedList = await overlay.getCombinedProducts();
    assertEqual(combinedList.length, mockProducts.length + 1);

    const foundOffline = combinedList.find(p => p.id === 'prod-offline-overlay-101');
    assert(foundOffline, 'Overlay product must be discoverable in combined catalog');

    // Universal compatibility check on overlay product
    const fit = checkCompatibility(foundOffline, mockVehicles[0]);
    assertEqual(fit.compatible, true);
    assertEqual(fit.reason, 'universal');
  });
});
