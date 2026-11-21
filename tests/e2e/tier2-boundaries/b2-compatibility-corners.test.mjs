/**
 * Tier 2 Boundary Test: B2 - 3-Tier Vehicle Compatibility Engine Corner Cases
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md § Feature 10
 * Corners: Unknown vehicle make, null/undefined vehicle fields, empty vehicleIds array,
 * case-mismatched make string, conflicting/malformed compatibility metadata.
 */

import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertIncludes,
} from '../helpers/assertions.mjs';
import { mockVehicles, mockProducts } from '../helpers/mock-data.mjs';
import { checkCompatibility } from '../helpers/test-env.mjs';

describe('Tier 2: B2 - Vehicle Compatibility Corner Cases', () => {
  const universalProduct = mockProducts.find(p => p.compatibility.type === 'universal');
  const singleProduct = mockProducts.find(p => p.compatibility.type === 'single');
  const multiProduct = mockProducts.find(p => p.compatibility.type === 'multi');
  const bmwVehicle = mockVehicles.find(v => v.id === 'bmw-3-g20');

  test('B2.1: null or undefined product or product with missing compatibility metadata returns safe incompatible result', () => {
    const resNullProd = checkCompatibility(null, bmwVehicle);
    assertEqual(resNullProd.compatible, false);
    assertEqual(resNullProd.reason, 'incompatible');
    assertIncludes(resNullProd.label, 'unavailable');

    const resUndefinedProd = checkCompatibility(undefined, bmwVehicle);
    assertEqual(resUndefinedProd.compatible, false);

    const resMissingCompat = checkCompatibility({ id: 'bad-prod-1', title: 'Broken Product' }, bmwVehicle);
    assertEqual(resMissingCompat.compatible, false);
    assertEqual(resMissingCompat.reason, 'incompatible');
  });

  test('B2.2: null or undefined selected vehicle prompts user to select vehicle while keeping compatible true', () => {
    // Contract Rule 2: unselected vehicle in garage prompts user
    const resSingle = checkCompatibility(singleProduct, null);
    assertEqual(resSingle.compatible, true);
    assertEqual(resSingle.reason, 'select_vehicle');
    assertEqual(resSingle.label, 'Select Vehicle to Check Fit');

    const resMulti = checkCompatibility(multiProduct, undefined);
    assertEqual(resMulti.compatible, true);
    assertEqual(resMulti.reason, 'select_vehicle');

    // Universal product always returns universal even if vehicle is null
    const resUniv = checkCompatibility(universalProduct, null);
    assertEqual(resUniv.compatible, true);
    assertEqual(resUniv.reason, 'universal');
  });

  test('B2.3: vehicle with missing or undefined fields (null id, make, or model) does not throw and safely handles check', () => {
    const corruptVehicle = {
      id: undefined,
      make: undefined,
      model: undefined,
    };

    const resSingle = checkCompatibility(singleProduct, corruptVehicle);
    assertEqual(resSingle.compatible, false);
    assertEqual(resSingle.reason, 'incompatible');

    const resMulti = checkCompatibility(multiProduct, corruptVehicle);
    assertEqual(resMulti.compatible, false);
    assertEqual(resMulti.reason, 'incompatible');

    // Universal product still fits any vehicle, even corrupt vehicle metadata
    const resUniv = checkCompatibility(universalProduct, corruptVehicle);
    assertEqual(resUniv.compatible, true);
    assertEqual(resUniv.reason, 'universal');
  });

  test('B2.4: multi-compatibility product with empty vehicleIds and compatibleMakes arrays rejects all vehicles', () => {
    const emptyMultiProduct = {
      id: 'prod-empty-multi',
      title: 'Defective Multi Product',
      compatibility: {
        type: 'multi',
        vehicleIds: [],
        compatibleMakes: [],
      },
    };

    for (const v of mockVehicles) {
      const res = checkCompatibility(emptyMultiProduct, v);
      assertEqual(
        res.compatible,
        false,
        `Empty multi-product must not match vehicle ${v.id}`
      );
      assertEqual(res.reason, 'incompatible');
    }
  });

  test('B2.5: case-mismatched make string evaluates correctly via case-insensitive normalization', () => {
    // Multi product supports BMW, Audi, Mercedes-Benz
    const mismatchedBmwVehicle = {
      id: 'bmw-custom-other',
      make: 'bMw', // lowercase/uppercase mix
      model: 'Custom BMW 330i',
    };

    const res = checkCompatibility(multiProduct, mismatchedBmwVehicle);
    assertEqual(res.compatible, true, 'Case-mismatched make "bMw" must match compatibleMakes ["BMW", ...]');
    assertEqual(res.reason, 'multi_match');
    assertIncludes(res.label, mismatchedBmwVehicle.model);

    const lowercaseAudi = {
      id: 'audi-custom-other',
      make: 'audi',
      model: 'Audi A4 Avant',
    };
    const resAudi = checkCompatibility(multiProduct, lowercaseAudi);
    assertEqual(resAudi.compatible, true);
    assertEqual(resAudi.reason, 'multi_match');
  });

  test('B2.6: conflicting or unknown compatibility type safely returns incompatible result', () => {
    const unknownTypeProduct = {
      id: 'prod-unknown-type',
      title: 'Strange Fitment Product',
      compatibility: {
        type: 'quantum_entanglement_fit',
        vehicleIds: [bmwVehicle.id],
      },
    };

    const res = checkCompatibility(unknownTypeProduct, bmwVehicle);
    assertEqual(res.compatible, false);
    assertEqual(res.reason, 'incompatible');
    assertEqual(res.label, 'Incompatible Vehicle');
  });

  test('B2.7: completely unknown vehicle make is rejected by single and multi fitment but accepted by universal', () => {
    const alienVehicle = {
      id: 'delorean-dmc-12-1981',
      make: 'DeLorean',
      model: 'DMC-12 Time Machine',
      yearRange: '1981-1983',
    };

    const resSingle = checkCompatibility(singleProduct, alienVehicle);
    assertEqual(resSingle.compatible, false, 'Single fitment should reject unknown vehicle');

    const resMulti = checkCompatibility(multiProduct, alienVehicle);
    assertEqual(resMulti.compatible, false, 'Multi fitment should reject unknown vehicle');

    const resUniv = checkCompatibility(universalProduct, alienVehicle);
    assertEqual(resUniv.compatible, true, 'Universal fitment must accept unknown vehicle make');
    assertEqual(resUniv.reason, 'universal');
  });
});
