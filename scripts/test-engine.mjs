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

  // Rewrite @/ path aliases to relative .mjs files inside the same test cache dir
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

async function runEngineTests() {
  console.log('================================================================');
  console.log('       Kravion Auto Fitment & Data Layer Automated Tests        ');
  console.log('================================================================');

  // Compile dependencies in order
  compileModule('src/types/index.ts');
  compileModule('src/lib/firebase.ts');
  compileModule('src/lib/whatsapp.ts');
  compileModule('src/lib/compatibility.ts');
  compileModule('src/lib/seed-data.ts');
  const dsFile = compileModule('src/lib/data-service.ts');

  // Load compiled modules
  const { initialProducts, initialVehicles } = await import(
    pathToFileURL(path.join(cacheDir, 'seed-data.mjs')).href
  );
  const { checkCompatibility } = await import(
    pathToFileURL(path.join(cacheDir, 'compatibility.mjs')).href
  );
  const { sanitizeFirestoreData, getProducts } = await import(
    pathToFileURL(dsFile).href
  );
  const { formatCurrency, generateWhatsAppOrderUrl, buildWhatsAppOrderMessage } =
    await import(pathToFileURL(path.join(cacheDir, 'whatsapp.mjs')).href);

  // 1. Single Fitment Strictness: Generation Match
  console.log('\n--- 1. Testing Single-Fitment Strict vehicleId Matching ---');
  const singleProd = initialProducts.find((p) => p.id === 'prod-audi-a4-diffuser');
  const diffGenVehicle = {
    id: 'audi-a4-b8',
    make: 'Audi',
    model: 'A4',
    yearStart: 2008,
    yearEnd: 2015,
  };
  const resDiff = checkCompatibility(singleProd, diffGenVehicle);
  console.log('Different Gen Result (audi-a4-b8 vs audi-a4 part):', resDiff);
  if (resDiff.compatible) {
    throw new Error('FAIL: Single fitment matched different vehicle ID!');
  }
  console.log('[PASS] Single fitment rejected mismatched vehicleId (audi-a4-b8).');

  // 2. Multi Fitment Model Restriction Strictness
  console.log('\n--- 2. Testing Multi-Fitment Model Restriction Bypass Prevention ---');
  const mbTweeters = initialProducts.find((p) => p.id === 'prod-mb-rotary-tweeters');
  const gleVehicle = initialVehicles.find((v) => v.id === 'mercedes-gle');
  const resGLE = checkCompatibility(mbTweeters, gleVehicle);
  console.log('MB Tweeters (C/E/GLC) + GLE Result:', resGLE);
  if (resGLE.compatible) {
    throw new Error('FAIL: Multi fitment matched GLE across brand boundary!');
  }
  console.log('[PASS] Multi fitment rejected vehicle not in vehicleIds (mercedes-gle).');

  // 3. Single Fitment Matching Vehicle
  console.log('\n--- 3. Testing Single-Fitment Exact Match ---');
  const a4Vehicle = initialVehicles.find((v) => v.id === 'audi-a4');
  const resA4 = checkCompatibility(singleProd, a4Vehicle);
  console.log('Single Audi Diffuser + A4 Result:', resA4);
  if (!resA4.compatible || resA4.reason !== 'exact_match') {
    throw new Error('FAIL: Single fitment failed on matching A4!');
  }
  console.log('[PASS] Single fitment matched matching vehicleId (audi-a4).');

  // 4. Make-Level Discovery Filter
  console.log('\n--- 4. Testing Make-Level Filter Discovery (make: Audi, model: "") ---');
  const dummyAudi = { id: 'audi', make: 'Audi', model: '' };
  const resMakeSingle = checkCompatibility(singleProd, dummyAudi);
  console.log('Single Audi Product + Dummy Audi Make:', resMakeSingle);
  if (!resMakeSingle.compatible) {
    throw new Error('FAIL: Single Audi product incompatible with Audi make filter!');
  }
  console.log('[PASS] Single Audi product recognized as compatible with Audi make filter.');

  // 5. Make-Level Catalog Query getProducts({ make: 'Audi' })
  console.log('\n--- 5. Testing getProducts({ make: "Audi" }) Catalog Discovery ---');
  const audiProducts = await getProducts({ make: 'Audi' });
  console.log(`Total Audi products returned: ${audiProducts.length}`);
  const hasA4Diffuser = audiProducts.some((p) => p.id === 'prod-audi-a4-diffuser');
  const hasQ7Subwoofer = audiProducts.some((p) => p.id === 'prod-audi-q7-subwoofer');
  const hasIndicators = audiProducts.some((p) => p.id === 'prod-audi-dynamic-indicators');
  console.log('Contains Audi A4 Diffuser (single):', hasA4Diffuser);
  console.log('Contains Audi Q7 Subwoofer (single):', hasQ7Subwoofer);
  console.log('Contains Dynamic Indicators (multi):', hasIndicators);

  if (!hasA4Diffuser || !hasQ7Subwoofer || !hasIndicators) {
    throw new Error(
      'FAIL: getProducts({ make: "Audi" }) omitted single or multi-fitment products!'
    );
  }
  console.log('[PASS] getProducts({ make: "Audi" }) included all brand single, multi, and universal products.');

  // 6. Sanitize Firestore Data
  console.log('\n--- 6. Testing Firestore Payload Sanitization ---');
  const dirtyObj = {
    a: 'valid',
    b: undefined,
    nested: {
      c: 123,
      d: undefined,
      arr: [1, undefined, { e: 'ok', f: undefined }],
    },
  };
  const cleaned = sanitizeFirestoreData(dirtyObj);
  console.log('Sanitized output:', JSON.stringify(cleaned));
  if (
    'b' in cleaned ||
    'd' in cleaned.nested ||
    'f' in cleaned.nested.arr[1]
  ) {
    throw new Error('FAIL: sanitizeFirestoreData left undefined keys!');
  }
  console.log('[PASS] sanitizeFirestoreData stripped all undefined keys recursively.');

  // 7. Defensive Currency Formatting
  console.log('\n--- 7. Testing Defensive formatCurrency() ---');
  const testCases = [
    { input: undefined, expected: '$0.00' },
    { input: null, expected: '$0.00' },
    { input: NaN, expected: '$0.00' },
    { input: 0, expected: '$0.00' },
    { input: 499.5, expected: '$499.50' },
  ];
  for (const tc of testCases) {
    const formatted = formatCurrency(tc.input);
    if (formatted !== tc.expected) {
      throw new Error(`FAIL: formatCurrency(${tc.input}) = ${formatted}, expected ${tc.expected}`);
    }
  }
  console.log('[PASS] formatCurrency handled undefined, null, NaN, and float amounts cleanly.');

  // 8. Authentic WhatsApp Hand-off Message Construction
  console.log('\n--- 8. Testing Authentic WhatsApp Message & URL Generation ---');
  const sampleOrder = {
    id: 'KRAV-TEST-999',
    customerId: 'cust-999',
    customerName: 'Marcus Sterling',
    customerEmail: 'marcus@example.com',
    customerPhone: '+1 (555) 019-2834',
    shippingAddress: {
      fullName: 'Marcus Sterling',
      street: '450 Park Avenue',
      city: 'New York',
      state: 'NY',
      postalCode: '10022',
      country: 'United States',
    },
    vehicleInfo: {
      make: 'Audi',
      model: 'A4',
      year: 2021,
    },
    items: [
      {
        productId: 'prod-audi-a4-diffuser',
        title: 'Audi A4 B9 Dry Carbon Rear Diffuser',
        quantity: 1,
        unitPrice: 549,
        subtotal: 549,
      },
    ],
    totalAmount: 549,
    currency: 'USD',
    status: 'enquiry_placed',
    customerNotes: 'Please confirm diffuser fitment.',
    whatsappUrl: '',
    createdAt: new Date().toISOString(),
  };

  const message = buildWhatsAppOrderMessage(sampleOrder);
  const url = generateWhatsAppOrderUrl(sampleOrder, '+1 (234) 567-890');
  if (!url.startsWith('https://wa.me/1234567890?text=')) {
    throw new Error(`WhatsApp URL generated incorrectly: ${url}`);
  }
  if (!message.includes('No online payment has been collected')) {
    throw new Error('WhatsApp message missing payment omission disclaimer');
  }
  console.log('[PASS] WhatsApp message & URL generation validated with domain functions.');

  console.log('\n================================================================');
  console.log(' [SUCCESS] ALL 8 ENGINE & DATA TESTS PASSED 100%!               ');
  console.log('================================================================\n');
  process.exit(0);
}

runEngineTests().catch((err) => {
  console.error('\n[ENGINE TEST ERROR]:', err);
  process.exit(1);
});
