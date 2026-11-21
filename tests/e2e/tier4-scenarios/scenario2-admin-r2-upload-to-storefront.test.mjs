/**
 * Tier 4 - Scenario 2: Admin R2 Asset Upload & Storefront Catalog Publishing
 * Specification: TEST_INFRA.md § Real-World Application Scenarios (Scenario 2)
 * Features Exercised: F3, F9, F10, F11
 *
 * Flow:
 * 1. Admin logs in with administrative credentials and passes admin role-based route guard.
 *    Non-admin customer session attempting admin access is verified to be blocked.
 * 2. Admin uploads high-resolution wheel accessory images to Cloudflare R2 bucket.
 *    Verifies public CDN URLs conforming to https://pub-bd9a15bceb394e7b95f90e4967940403.r2.dev.
 * 3. Admin creates a new product with multi-fitment compatibility (BMW, Audi, Mercedes, Porsche)
 *    and links the uploaded R2 image URLs. Persists product into Firestore.
 * 4. Admin uploads a homepage hero banner to R2 and creates a new carousel banner slide linking
 *    to the new wheels collection.
 * 5. Verifies end-to-end storefront discovery:
 *    - Homepage hero carousel displays newly published active banner.
 *    - Catalog faceted search discovers new product by category and keyword.
 *    - Product detail view renders Cloudflare R2 images and verifies multi-vehicle compatibility.
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
  mockVehicles,
  mockUserSessions,
  R2_PUBLIC_BASE_URL,
} from '../helpers/mock-data.mjs';
import {
  ENV_CONFIG,
  MockFirestoreDatabase,
  ResilientDataService,
  MockCloudflareR2Client,
  checkCompatibility,
  checkAuthGuard,
} from '../helpers/test-env.mjs';

describe('Tier 4: Scenario 2 - Admin R2 Asset Upload & Storefront Catalog Publishing', () => {
  let db;
  let dataService;
  let r2Client;

  beforeEach(() => {
    db = new MockFirestoreDatabase();
    dataService = new ResilientDataService(db);
    r2Client = new MockCloudflareR2Client();
  });

  test('admin uploads R2 media, creates multi-fitment product, publishes banner, and storefront discovers product', async () => {
    // -----------------------------------------------------------------------
    // Step 1: Admin Role-Based Access Control Verification
    // -----------------------------------------------------------------------
    const customerSession = mockUserSessions.customerUser;
    const adminSession = mockUserSessions.adminUser;

    // Verify regular customer is rejected from admin route
    const customerAdminAttempt = checkAuthGuard(customerSession, '/admin/products');
    assertEqual(customerAdminAttempt.allowed, false);
    assertEqual(customerAdminAttempt.reason, 'forbidden_non_admin');
    assertEqual(customerAdminAttempt.redirectUrl, '/unauthorized');

    // Verify admin user is granted access
    const adminAuthCheck = checkAuthGuard(adminSession, '/admin/products');
    assertEqual(adminAuthCheck.allowed, true);
    assertEqual(adminAuthCheck.redirectUrl, null);

    // -----------------------------------------------------------------------
    // Step 2: Admin Uploads High-Res Media to Cloudflare R2
    // -----------------------------------------------------------------------
    const mainImgKey = 'products/kravion-20in-forged-monoblock-main.webp';
    const angleImgKey = 'products/kravion-20in-forged-monoblock-angle.webp';

    const mainUpload = await r2Client.putObject({
      Bucket: ENV_CONFIG.cloudflareR2.bucketName,
      Key: mainImgKey,
      Body: Buffer.from('mock-high-res-forged-wheels-binary-data'),
      ContentType: 'image/webp',
    });
    assertEqual(mainUpload.success, true);
    assertEqual(mainUpload.url, `${R2_PUBLIC_BASE_URL}/${mainImgKey}`);

    const angleUpload = await r2Client.putObject({
      Bucket: ENV_CONFIG.cloudflareR2.bucketName,
      Key: angleImgKey,
      Body: Buffer.from('mock-high-res-forged-wheels-angle-binary-data'),
      ContentType: 'image/webp',
    });
    assertEqual(angleUpload.success, true);
    assertEqual(angleUpload.url, `${R2_PUBLIC_BASE_URL}/${angleImgKey}`);

    // Verify objects are present in R2 storage
    const storedObject = await r2Client.getObject({
      Bucket: ENV_CONFIG.cloudflareR2.bucketName,
      Key: mainImgKey,
    });
    assertEqual(storedObject.contentType, 'image/webp');
    assertGreaterThan(storedObject.size, 0);

    // -----------------------------------------------------------------------
    // Step 3: Admin Creates New Product with Multi-Fitment Rules
    // -----------------------------------------------------------------------
    const newWheelProduct = {
      id: 'prod-forged-monoblock-20',
      title: 'Kravion 20" Lightweight Forged Monoblock Aero Wheels (Set of 4)',
      slug: 'kravion-20in-lightweight-forged-monoblock-wheels',
      price: 2450.0,
      compareAtPrice: 2890.0,
      categoryId: 'wheels',
      categoryName: 'Wheels & Accessories',
      description: 'Aerospace grade 6061-T6 forged aluminum wheels engineered for high-performance German GT sedans and coupes.',
      images: [mainUpload.url, angleUpload.url],
      specs: {
        dimensions: '20x9.0J ET28 Front / 20x10.5J ET35 Rear',
        weight: '9.4 kg per wheel',
        material: 'Forged 6061-T6 Aerospace Aluminum',
        warranty: '5-Year Structural Integrity Warranty',
      },
      ratings: {
        rating: 5.0,
        reviewCount: 3,
      },
      stock: {
        status: 'in_stock',
        inventory: 6,
      },
      compatibility: {
        type: 'multi',
        vehicleIds: ['bmw-3-g20', 'bmw-m4-g82', 'audi-a4-b9', 'mb-c-w206', 'porsche-911-992'],
        compatibleMakes: ['BMW', 'Audi', 'Mercedes-Benz', 'Porsche'],
      },
      featured: true,
      createdAt: new Date().toISOString(),
    };

    await db.setDoc('products', newWheelProduct.id, newWheelProduct);

    // Verify stored product in database
    const savedProd = await db.getDoc('products', newWheelProduct.id);
    assert(savedProd, 'New product must be successfully saved in Firestore');
    assertEqual(savedProd.images.length, 2);
    assertEqual(savedProd.compatibility.type, 'multi');

    // -----------------------------------------------------------------------
    // Step 4: Admin Uploads Hero Banner to R2 and Updates Carousel
    // -----------------------------------------------------------------------
    const bannerKey = 'banners/hero-monoblock-forged-series.webp';
    const bannerUpload = await r2Client.putObject({
      Bucket: ENV_CONFIG.cloudflareR2.bucketName,
      Key: bannerKey,
      Body: Buffer.from('mock-banner-high-res-hero-image'),
      ContentType: 'image/webp',
    });

    const newBanner = {
      id: 'banner-hero-forged-wheels',
      title: 'Uncompromised Strength: Forged Monoblock Series',
      subtitle: 'Aerospace-Grade 6061-T6 Engineering for Track & Street',
      imageUrl: bannerUpload.url,
      link: `/products/${newWheelProduct.id}`,
      order: 0, // Set to highest priority (order 0)
      isActive: true,
    };

    await db.setDoc('banners', newBanner.id, newBanner);

    // -----------------------------------------------------------------------
    // Step 5: Storefront Verification - Carousel, Catalog Search & Fitment Check
    // -----------------------------------------------------------------------
    // 5a. Verify Homepage Carousel
    const storefrontBanners = await dataService.getBanners();
    const activeBanners = storefrontBanners
      .filter(b => b.isActive)
      .sort((a, b) => a.order - b.order);

    const firstBanner = activeBanners[0];
    assertEqual(firstBanner.id, 'banner-hero-forged-wheels');
    assertEqual(firstBanner.imageUrl, `${R2_PUBLIC_BASE_URL}/${bannerKey}`);
    assertEqual(firstBanner.link, `/products/${newWheelProduct.id}`);

    // 5b. Verify Storefront Catalog Keyword Search
    const searchResults = await dataService.getProducts({ query: 'forged' });
    assertGreaterThan(searchResults.length, 0);
    const foundProduct = searchResults.find(p => p.id === newWheelProduct.id);
    assert(foundProduct, 'Newly published wheels product must appear in storefront search');
    assertEqual(foundProduct.images[0], mainUpload.url);

    // 5c. Verify Category & Make Filter
    const porscheWheels = await dataService.getProducts({
      make: 'Porsche',
      categoryId: 'wheels',
    });
    assertGreaterThan(porscheWheels.length, 0);
    assert(porscheWheels.some(p => p.id === newWheelProduct.id));

    // 5d. Verify Multi-Fitment on Product Detail View
    const porsche911 = mockVehicles.find(v => v.id === 'porsche-911-992');
    const bmwG20 = mockVehicles.find(v => v.id === 'bmw-3-g20');
    const nonCompatibleVehicle = {
      id: 'honda-civic-fk8',
      make: 'Honda',
      model: 'Civic Type R',
    };

    // Compatible with Porsche 911
    const porscheFitment = checkCompatibility(foundProduct, porsche911);
    assertEqual(porscheFitment.compatible, true);
    assertEqual(porscheFitment.reason, 'multi_match');
    assertIncludes(porscheFitment.label, porsche911.model);

    // Compatible with BMW G20
    const bmwFitment = checkCompatibility(foundProduct, bmwG20);
    assertEqual(bmwFitment.compatible, true);
    assertEqual(bmwFitment.reason, 'multi_match');
    assertIncludes(bmwFitment.label, bmwG20.model);

    // Incompatible with vehicle outside rules
    const hondaFitment = checkCompatibility(foundProduct, nonCompatibleVehicle);
    assertEqual(hondaFitment.compatible, false);
    assertEqual(hondaFitment.reason, 'incompatible');
  });
});
