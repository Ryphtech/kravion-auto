/**
 * Kravion Auto - Milestone 2 Verification Suite
 * Validates Vehicle Compatibility & Storefront Discovery features
 */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';

const cacheDir = path.resolve('node_modules/.cache/test-dist');
fs.mkdirSync(cacheDir, { recursive: true });

function compileModule(srcRel) {
  const fullPath = path.resolve(srcRel);
  const code = fs.readFileSync(fullPath, 'utf8');
  const baseName = path.basename(srcRel, path.extname(srcRel));

  const rewritten = code.replace(/from\s+['"]@\/(.*?)['"]/g, (_match, p1) => {
    const targetBase = path.basename(p1);
    return `from './${targetBase}.mjs'`;
  });

  const { outputText } = ts.transpileModule(rewritten, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });

  const outFile = path.join(cacheDir, `${baseName}.mjs`);
  fs.writeFileSync(outFile, outputText);
  return outFile;
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runMilestone2Tests() {
  console.log('================================================================');
  console.log('       Kravion Auto Milestone 2 Verification Suite              ');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  // 1. Deliverable File Existence Check
  console.log('--- 1. Checking Milestone 2 Target Files ---');
  const requiredFiles = [
    'src/context/GarageContext.tsx',
    'src/components/layout/GarageModal.tsx',
    'src/components/layout/Header.tsx',
    'src/components/layout/Footer.tsx',
    'src/app/(storefront)/layout.tsx',
    'src/components/storefront/HeroCarousel.tsx',
    'src/components/storefront/ProductCard.tsx',
    'src/app/(storefront)/page.tsx',
    'src/app/(storefront)/products/page.tsx',
    'src/app/(storefront)/products/[id]/ProductDetailClient.tsx',
    'src/app/(storefront)/products/[id]/page.tsx',
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(rootDir, relPath);
    assert(fs.existsSync(fullPath), `Target file exists: ${relPath}`);
  }

  // 2. Checking Content Integrity of GarageContext
  console.log('\n--- 2. Checking GarageContext Requirements ---');
  const garageContextContent = fs.readFileSync(path.join(rootDir, 'src/context/GarageContext.tsx'), 'utf-8');
  assert(garageContextContent.includes('kravion_selected_vehicle'), 'GarageContext uses localStorage key "kravion_selected_vehicle"');
  assert(garageContextContent.includes('useGarage'), 'GarageContext exports useGarage hook');
  assert(garageContextContent.includes('selectVehicle'), 'GarageContext exports selectVehicle method');
  assert(garageContextContent.includes('clearVehicle'), 'GarageContext exports clearVehicle method');
  assert(garageContextContent.includes('openGarageModal') && garageContextContent.includes('closeGarageModal'), 'GarageContext controls modal visibility');

  // 3. Checking Header & Garage Badge Integration
  console.log('\n--- 3. Checking Header & Garage Badge Integration ---');
  const headerContent = fs.readFileSync(path.join(rootDir, 'src/components/layout/Header.tsx'), 'utf-8');
  assert(headerContent.includes('useGarage'), 'Header integrates with useGarage');
  assert(headerContent.includes('openGarageModal'), 'Header allows opening GarageModal');
  assert(headerContent.includes('My Garage') || headerContent.includes('Garage'), 'Header renders My Garage element');
  assert(headerContent.includes('useCart'), 'Header displays live cart count');
  assert(headerContent.includes('useWishlist'), 'Header displays wishlist count');

  // 4. Checking GarageModal Cascading Selection
  console.log('\n--- 4. Checking GarageModal Dynamic Cascading Selection ---');
  const garageModalContent = fs.readFileSync(path.join(rootDir, 'src/components/layout/GarageModal.tsx'), 'utf-8');
  assert(garageModalContent.includes('Make') && garageModalContent.includes('Model') && garageModalContent.includes('Year'), 'GarageModal provides Make -> Model -> Year selection');
  assert(garageModalContent.includes('Set as My Vehicle'), 'GarageModal includes "Set as My Vehicle" action');
  assert(garageModalContent.includes('clearVehicle') || garageModalContent.includes('Clear Vehicle'), 'GarageModal includes "Clear Vehicle" action');

  // Compile TS modules for fitment execution
  compileModule('src/types/index.ts');
  compileModule('src/lib/compatibility.ts');
  compileModule('src/lib/seed-data.ts');

  const { initialProducts, initialVehicles } = await import(
    pathToFileURL(path.join(cacheDir, 'seed-data.mjs')).href
  );
  const { checkCompatibility, filterProductsByVehicle } = await import(
    pathToFileURL(path.join(cacheDir, 'compatibility.mjs')).href
  );

  // 5. Checking 3-Tier Compatibility with Seed Catalog
  console.log('\n--- 5. Checking 3-Tier Compatibility Matrix with Seed Catalog ---');
  const audiA4 = initialVehicles.find(v => v.id === 'audi-a4');
  const bmw3 = initialVehicles.find(v => v.id === 'bmw-3-series');
  const mbC = initialVehicles.find(v => v.id === 'mercedes-c-class');
  assert(audiA4 && bmw3 && mbC, 'Seed vehicles for Audi, BMW, and Mercedes-Benz found');

  // Single-fitment check
  const singleAudiPart = initialProducts.find(p => p.id === 'prod-audi-a4-diffuser');
  assert(singleAudiPart, 'Found single-fitment Audi diffuser');
  const resAudiOnAudi = checkCompatibility(singleAudiPart, audiA4);
  assert(resAudiOnAudi.compatible && resAudiOnAudi.reason === 'exact_match', 'Single Audi diffuser matches Audi A4');
  const resAudiOnBMW = checkCompatibility(singleAudiPart, bmw3);
  assert(!resAudiOnBMW.compatible && resAudiOnBMW.reason === 'incompatible', 'Single Audi diffuser rejects BMW 3-Series');

  // Multi-fitment check
  const multiIndicators = initialProducts.find(p => p.id === 'prod-audi-dynamic-indicators');
  assert(multiIndicators, 'Found multi-fitment Audi indicators');
  const resMultiAudi = checkCompatibility(multiIndicators, audiA4);
  assert(resMultiAudi.compatible, 'Multi indicators match Audi A4');
  const resMultiBMW = checkCompatibility(multiIndicators, bmw3);
  assert(!resMultiBMW.compatible, 'Multi indicators reject BMW 3-Series');

  // Universal fitment check
  const universalAmbient = initialProducts.find(p => p.id === 'prod-univ-ambient-lighting-kit');
  assert(universalAmbient, 'Found universal Symphony LED part');
  const resUniAudi = checkCompatibility(universalAmbient, audiA4);
  const resUniBMW = checkCompatibility(universalAmbient, bmw3);
  const resUniNull = checkCompatibility(universalAmbient, null);
  assert(resUniAudi.compatible && resUniAudi.reason === 'universal', 'Universal part fits Audi');
  assert(resUniBMW.compatible && resUniBMW.reason === 'universal', 'Universal part fits BMW');
  assert(resUniNull.compatible && resUniNull.reason === 'universal', 'Universal part fits when no vehicle selected');

  // 6. Checking "Fits My Garage" Filtering
  console.log('\n--- 6. Checking "Fits My Garage" Catalog Filtering ---');
  const audiCompatibleCatalog = filterProductsByVehicle(initialProducts, audiA4);
  assert(audiCompatibleCatalog.length > 0, `Audi catalog has ${audiCompatibleCatalog.length} compatible items`);
  assert(audiCompatibleCatalog.some(p => p.id === 'prod-audi-a4-diffuser'), 'Includes single-fitment Audi diffuser');
  assert(audiCompatibleCatalog.some(p => p.id === 'prod-univ-ambient-lighting-kit'), 'Includes universal ambient lighting');
  assert(!audiCompatibleCatalog.some(p => p.id === 'prod-bmw-3-front-lip'), 'Excludes BMW 3 Front Lip');

  // Mercedes-Benz C-Class Catalog Resolution & Filtering
  console.log('\n--- 6b. Checking Mercedes-Benz C-Class Dynamic Resolution & Catalog Filtering ---');
  const selectedMake = 'Mercedes-Benz';
  const selectedModel = 'C-Class';
  const matchedVehicle = initialVehicles.find(
    (v) =>
      v.make.toLowerCase() === selectedMake.toLowerCase() &&
      v.model.toLowerCase() === selectedModel.toLowerCase()
  );
  assert(matchedVehicle && matchedVehicle.id === 'mercedes-c-class', 'Resolved matchedVehicle from vehicles state for Mercedes-Benz C-Class (id: mercedes-c-class)');

  const mbCCompatibleCatalog = filterProductsByVehicle(initialProducts, matchedVehicle);
  assert(mbCCompatibleCatalog.length === 6, `Mercedes-Benz C-Class catalog returns all 6 compatible items (got ${mbCCompatibleCatalog.length})`);
  assert(mbCCompatibleCatalog.some(p => p.id === 'prod-mb-c-class-grille'), 'Includes single-fitment Mercedes C-Class Panamericana Grille');
  assert(mbCCompatibleCatalog.some(p => p.id === 'prod-mb-rotary-tweeters'), 'Includes multi-fitment 3D Rotary Tweeters');
  assert(mbCCompatibleCatalog.some(p => p.id === 'prod-mb-turbine-air-vents'), 'Includes multi-fitment Turbine LED Air Vents');
  assert(mbCCompatibleCatalog.some(p => p.id === 'prod-univ-ambient-lighting-kit'), 'Includes Universal Ambient Lighting Kit');
  assert(mbCCompatibleCatalog.some(p => p.id === 'prod-univ-magsafe-charger'), 'Includes Universal MagSafe Mount');
  assert(mbCCompatibleCatalog.some(p => p.id === 'prod-univ-4k-dashcam'), 'Includes Universal 4K Dashcam');

  // Defensive Fitment Strictness Check
  console.log('\n--- 6c. Checking Defensive Compatibility Strictness ---');
  // Strict single fitment rejection when vehicleId and selectedVehicle.id are undefined
  const singleUndefProduct = {
    id: 'prod-test-undef',
    title: 'Test Undefined Part',
    price: 100,
    category: 'accessories',
    categoryName: 'Accessories',
    compatibility: {
      type: 'single',
    },
  };
  const undefVehicle = {
    id: undefined,
    make: 'Mercedes-Benz',
    model: 'C-Class',
  };
  const resUndefFit = checkCompatibility(singleUndefProduct, undefVehicle);
  assert(!resUndefFit.compatible && resUndefFit.reason === 'incompatible', 'Strict single fitment rejects when vehicleId and selectedVehicle.id are undefined');

  // Defensive make-only check when selectedVehicle.make is undefined
  const noMakeVehicle = {
    id: 'test-vehicle',
    make: undefined,
    model: '',
  };
  const resNoMakeFit = checkCompatibility(singleAudiPart, noMakeVehicle);
  assert(!resNoMakeFit.compatible && resNoMakeFit.reason === 'incompatible', 'Defensively handles vehicle with undefined make without throwing');

  // 7. Checking Storefront Product Detail Page Compatibility Banner
  console.log('\n--- 7. Checking Product Detail Page Compatibility Banner ---');
  const detailClientContent = fs.readFileSync(path.join(rootDir, 'src/app/(storefront)/products/[id]/ProductDetailClient.tsx'), 'utf-8');
  assert(detailClientContent.includes('Guaranteed Fit for'), 'Product Detail includes Guaranteed Fit banner');
  assert(detailClientContent.includes('Does Not Fit Your') || detailClientContent.includes('Does not fit'), 'Product Detail includes Incompatible warning banner');
  assert(detailClientContent.includes('Universal Fit'), 'Product Detail includes Universal Fit banner');
  assert(detailClientContent.includes('openGarageModal'), 'Product Detail allows opening GarageModal when no vehicle selected');

  // 8. Checking Storefront Products Page Resolution Integrity
  console.log('\n--- 8. Checking Storefront Products Page Resolution Integrity ---');
  const productsPageContent = fs.readFileSync(path.join(rootDir, 'src/app/(storefront)/products/page.tsx'), 'utf-8');
  assert(productsPageContent.includes('matchedVehicle'), 'products/page.tsx resolves matchedVehicle from vehicles state');
  assert(productsPageContent.includes('vehicles.find'), 'products/page.tsx looks up vehicle in loaded vehicles state');
  assert(productsPageContent.includes('vehicles,'), 'products/page.tsx includes vehicles in useMemo dependency array');

  console.log('\n================================================================');
  console.log(' [SUCCESS] ALL MILESTONE 2 AUTOMATED CHECKS PASSED 100%!        ');
  console.log('================================================================\n');
}

runMilestone2Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
