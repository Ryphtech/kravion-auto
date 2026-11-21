import { Product, Vehicle } from '@/types';

export type CompatibilityReason =
  | 'universal'
  | 'exact_match'
  | 'multi_match'
  | 'incompatible'
  | 'select_vehicle';

export interface CompatibilityResult {
  compatible: boolean;
  reason: CompatibilityReason;
  label: string;
}

/**
 * 3-Tier Vehicle Compatibility Calculation Engine
 *
 * Rule Hierarchy:
 * 1. If product.compatibility.type === 'universal' -> Universal Fit
 * 2. If selectedVehicle === null -> Select Vehicle to Check Fit
 * 3. If product.compatibility.type === 'single' -> match on vehicleId or vehicleIds[0]
 * 4. If product.compatibility.type === 'multi' -> match on vehicleIds or compatibleMakes
 */
export function checkCompatibility(
  product: Product,
  selectedVehicle: Vehicle | null
): CompatibilityResult {
  if (product.compatibility.type === 'universal') {
    return {
      compatible: true,
      reason: 'universal',
      label: 'Universal Fit',
    };
  }

  if (!selectedVehicle) {
    return {
      compatible: true,
      reason: 'select_vehicle',
      label: 'Select Vehicle to Check Fit',
    };
  }

  const isMakeOnlyCheck =
    !selectedVehicle.model || selectedVehicle.model.trim() === '';
  const vehicleName = isMakeOnlyCheck
    ? selectedVehicle.make || 'Vehicle'
    : `${selectedVehicle.make || ''} ${selectedVehicle.model || ''}`.trim() || 'Vehicle';

  // Make-level catalog discovery check (e.g. filtering by make without specific model)
  if (isMakeOnlyCheck) {
    const targetMake = selectedVehicle.make ? selectedVehicle.make.toLowerCase() : '';
    const matchesMake =
      product.compatibility.compatibleMakes?.some(
        (m) => m.toLowerCase() === targetMake
      ) ||
      Boolean(
        product.compatibility.vehiclesDisplay?.some(
          (v) => v.make.toLowerCase() === targetMake
        )
      );

    if (matchesMake) {
      return {
        compatible: true,
        reason:
          product.compatibility.type === 'single' ? 'exact_match' : 'multi_match',
        label: `Fits ${selectedVehicle.make || 'Vehicle'}`,
      };
    }

    return {
      compatible: false,
      reason: 'incompatible',
      label: `Does not fit ${selectedVehicle.make || 'Vehicle'}`,
    };
  }

  if (product.compatibility.type === 'single') {
    const singleVehicleId =
      product.compatibility.vehicleId ||
      (product.compatibility.vehicleIds && product.compatibility.vehicleIds[0]);

    // Strictly enforce matching vehicleId. Do not fall back to loose make/model string equality.
    const isMatch =
      Boolean(singleVehicleId && selectedVehicle.id && singleVehicleId === selectedVehicle.id) ||
      Boolean(
        selectedVehicle.id &&
        product.compatibility.vehiclesDisplay?.some(
          (v) => v.vehicleId === selectedVehicle.id
        )
      );

    if (isMatch) {
      return {
        compatible: true,
        reason: 'exact_match',
        label: `Guaranteed Fit for ${vehicleName}`,
      };
    }

    return {
      compatible: false,
      reason: 'incompatible',
      label: `Does not fit ${vehicleName}`,
    };
  }

  if (product.compatibility.type === 'multi') {
    const ids = product.compatibility.vehicleIds || [];
    const makes = product.compatibility.compatibleMakes || [];

    const isIdMatch =
      Boolean(selectedVehicle.id && ids.includes(selectedVehicle.id)) ||
      Boolean(
        selectedVehicle.id &&
        product.compatibility.vehiclesDisplay?.some(
          (v) => v.vehicleId === selectedVehicle.id
        )
      );

    let isMatch = false;
    if (ids.length > 0) {
      // If specific vehicleIds are designated, fitment strictly requires matching ID
      isMatch = isIdMatch;
    } else {
      // If no specific vehicleIds designated, fall back to brand-wide compatible makes
      isMatch =
        makes.some(
          (m) => m.toLowerCase() === (selectedVehicle.make ? selectedVehicle.make.toLowerCase() : '')
        ) || isIdMatch;
    }

    if (isMatch) {
      return {
        compatible: true,
        reason: 'multi_match',
        label: `Fits ${vehicleName}`,
      };
    }

    return {
      compatible: false,
      reason: 'incompatible',
      label: `Does not fit ${vehicleName}`,
    };
  }

  return {
    compatible: false,
    reason: 'incompatible',
    label: `Incompatible with ${vehicleName}`,
  };
}

/**
 * Filters a list of products based on vehicle compatibility
 */
export function filterProductsByVehicle(
  products: Product[],
  selectedVehicle: Vehicle | null
): Product[] {
  if (!selectedVehicle) {
    return products;
  }

  return products.filter((product) => {
    const result = checkCompatibility(product, selectedVehicle);
    return result.compatible;
  });
}
