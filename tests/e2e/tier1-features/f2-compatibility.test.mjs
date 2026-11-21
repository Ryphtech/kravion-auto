/**
 * Tier 1 Feature Test: F2 - 3-Tier Vehicle Compatibility Engine
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md § Vehicle Compatibility Contract
 */

import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertMatch,
} from '../helpers/assertions.mjs';
import { mockVehicles, mockProducts } from '../helpers/mock-data.mjs';
import { checkCompatibility } from '../helpers/test-env.mjs';

describe('Tier 1: F2 - 3-Tier Vehicle Compatibility Engine', () => {
  const bmwG20 = mockVehicles.find(v => v.id === 'bmw-3-g20');
  const audiA4 = mockVehicles.find(v => v.id === 'audi-a4-b9');
  const porsche911 = mockVehicles.find(v => v.id === 'porsche-911-992');

  const universalProduct = mockProducts.find(p => p.compatibility.type === 'universal');
  const singleBmwProduct = mockProducts.find(p => p.id === 'prod-single-bmw-lip');
  const multiProduct = mockProducts.find(p => p.id === 'prod-multi-german-led');
  const porscheProduct = mockProducts.find(p => p.id === 'prod-multi-porsche-exhaust');

  test('F2.1: universal fitment product fits any vehicle regardless of make or model', () => {
    assert(universalProduct, 'Universal product fixture must exist');

    const resultBmw = checkCompatibility(universalProduct, bmwG20);
    assertEqual(resultBmw.compatible, true);
    assertEqual(resultBmw.reason, 'universal');
    assertEqual(resultBmw.label, 'Universal Fit');

    const resultAudi = checkCompatibility(universalProduct, audiA4);
    assertEqual(resultAudi.compatible, true);
    assertEqual(resultAudi.reason, 'universal');

    const resultPorsche = checkCompatibility(universalProduct, porsche911);
    assertEqual(resultPorsche.compatible, true);
    assertEqual(resultPorsche.reason, 'universal');
  });

  test('F2.2: single-vehicle product matches designated vehicle ID', () => {
    assert(singleBmwProduct, 'Single BMW product fixture must exist');

    const result = checkCompatibility(singleBmwProduct, bmwG20);
    assertEqual(result.compatible, true);
    assertEqual(result.reason, 'exact_match');
    assertMatch(result.label, /Direct Fit/i);
  });

  test('F2.3: single-vehicle product rejects mismatching vehicle', () => {
    const result = checkCompatibility(singleBmwProduct, audiA4);
    assertEqual(result.compatible, false);
    assertEqual(result.reason, 'incompatible');
    assertMatch(result.label, /Does Not Fit/i);
  });

  test('F2.4: multi-vehicle product matches vehicle in vehicleIds list or compatibleMakes', () => {
    assert(multiProduct, 'Multi product fixture must exist');

    // BMW G20 is in vehicleIds and make is in compatibleMakes
    const resultBmw = checkCompatibility(multiProduct, bmwG20);
    assertEqual(resultBmw.compatible, true);
    assertEqual(resultBmw.reason, 'multi_match');

    // Audi A4 is in vehicleIds
    const resultAudi = checkCompatibility(multiProduct, audiA4);
    assertEqual(resultAudi.compatible, true);
    assertEqual(resultAudi.reason, 'multi_match');
  });

  test('F2.5: multi-vehicle product rejects vehicle not listed in rules', () => {
    // Porsche 911 is NOT in multiProduct (German executive LED) vehicleIds or makes
    const resultPorsche = checkCompatibility(porscheProduct, bmwG20);
    assertEqual(resultPorsche.compatible, false);
    assertEqual(resultPorsche.reason, 'incompatible');
    assertMatch(resultPorsche.label, /Does Not Fit/i);
  });

  test('F2.6: null vehicle in garage prompts user to select vehicle with compatible true', () => {
    const result = checkCompatibility(singleBmwProduct, null);
    assertEqual(result.compatible, true);
    assertEqual(result.reason, 'select_vehicle');
    assertEqual(result.label, 'Select Vehicle to Check Fit');
  });
});
