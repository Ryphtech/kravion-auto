import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  terminate,
} from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyAf-rGHLZHG0VUtpgN811UjetBhUTTfu74',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'kravion-auto.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kravion-auto',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'kravion-auto.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '162661378547',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:162661378547:web:2e7040bd9ddc2914ebca86',
};

function sanitizeForFirestore(data) {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item));
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSeed() {
  console.log('====================================================');
  console.log('      KRAVION AUTO — FIRESTORE SEEDING UTILITY      ');
  console.log('====================================================');

  const app = initializeApp(FIREBASE_CONFIG, `seed-app-${Date.now()}`);
  const db = getFirestore(app);

  try {
    // 1. Transpile seed data
    console.log('[1/5] Transpiling seed-data.ts from src/lib/seed-data.ts...');
    const seedPath = path.resolve('src/lib/seed-data.ts');
    const seedSource = fs.readFileSync(seedPath, 'utf8');
    const { outputText } = ts.transpileModule(seedSource, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    const base64Module = Buffer.from(outputText).toString('base64');
    const seedModule = await import(`data:text/javascript;base64,${base64Module}`);

    const {
      initialCategories,
      initialVehicles,
      initialProducts,
      initialPosters,
      initialSettings,
    } = seedModule;

    console.log(`[Seed Dataset Loaded]`);
    console.log(`  - Categories: ${initialCategories.length}`);
    console.log(`  - Vehicles:   ${initialVehicles.length}`);
    console.log(`  - Products:   ${initialProducts.length}`);
    console.log(`  - Posters:    ${initialPosters.length}`);
    console.log(`  - Settings:   Store: "${initialSettings.storeName}"`);

    // 2. Test write access with retry
    console.log('\n[2/5] Testing Firestore write access with current security rules...');
    let writeAllowed = false;
    let attempts = 0;
    const maxAttempts = 1; // Run 1 immediate check

    while (!writeAllowed && attempts < maxAttempts) {
      attempts++;
      try {
        const testDocRef = doc(db, 'settings', 'store');
        await setDoc(testDocRef, sanitizeForFirestore({ ...initialSettings, updatedAt: new Date().toISOString() }));
        writeAllowed = true;
        console.log('  -> Write access granted! Security rules allow writes.');
      } catch (testErr) {
        if (testErr.code === 'permission-denied') {
          console.error('\n[FIRESTORE PERMISSION DENIED]');
          console.error('Firebase Console is currently blocking all reads and writes with:');
          console.error('  allow read, write: if false;\n');
          console.error('To allow data upload:');
          console.error('  1. In Firebase Console -> Cloud Firestore -> "Rules" tab (open on your screen)');
          console.error('  2. Paste the updated rules from firestore.rules:');
          console.error('     rules_version = \'2\';');
          console.error('     service cloud.firestore {');
          console.error('       match /databases/{database}/documents {');
          console.error('         match /{document=**} {');
          console.error('           allow read, write: if true;');
          console.error('         }');
          console.error('       }');
          console.error('     }');
          console.error('  3. Click "Publish", then run: npm run seed:firestore\n');
          process.exitCode = 1;
          return;
        }
        throw testErr;
      }
    }

    // 3. Seed Categories
    console.log('\n[3/5] Seeding Categories...');
    for (const cat of initialCategories) {
      const catRef = doc(db, 'categories', cat.id);
      await setDoc(catRef, sanitizeForFirestore(cat));
      console.log(`  + Category: ${cat.name} (${cat.slug})`);
    }

    // 4. Seed Vehicles
    console.log('\n[4/5] Seeding Vehicle Directory...');
    for (const veh of initialVehicles) {
      const vehRef = doc(db, 'vehicles', veh.id);
      await setDoc(vehRef, sanitizeForFirestore(veh));
      console.log(`  + Vehicle: ${veh.make} ${veh.model} (${veh.generation || veh.yearRange})`);
    }

    // 5. Seed Products
    console.log('\n[5/5] Seeding Products...');
    for (const prod of initialProducts) {
      const prodRef = doc(db, 'products', prod.id);
      await setDoc(prodRef, sanitizeForFirestore(prod));
      console.log(`  + Product: ${prod.title} [${prod.sku}]`);
    }

    // 6. Seed Posters
    console.log('\n[Bonus] Seeding Carousel Posters...');
    for (const poster of initialPosters) {
      const posterRef = doc(db, 'posters', poster.id);
      await setDoc(posterRef, sanitizeForFirestore(poster));
      console.log(`  + Banner: ${poster.title}`);
    }

    console.log('\n====================================================');
    console.log('   SUCCESS: ALL DATA PERSISTED TO CLOUD FIRESTORE!   ');
    console.log('====================================================');
  } catch (err) {
    console.error('Seeding encountered an unexpected error:', err);
    process.exitCode = 1;
  } finally {
    await terminate(db);
  }
}

runSeed();
