import type { 
  AdminSettings, 
  PricingBreakdown, 
  HungerLevel, 
  MenuSelection, 
  AddOnSelection, 
  CateringAddon,
  Product,
  ProductVariant
} from '../types';

/**
 * Configuration interface for pricing calculations
 */
export interface PricingCalculationInput {
  guestCount: number;
  hungerLevel: HungerLevel;
  distanceMiles: number;
  menuSelections: MenuSelection[];
  addOns: AddOnSelection[];
  adminSettings: AdminSettings;
  products: Product[];
  cateringAddons: CateringAddon[];
}

/**
 * Detailed pricing breakdown with individual components
 */
export interface DetailedPricingBreakdown extends PricingBreakdown {
  baseMenuCosts: {
    proteinCosts: number;
    sideCosts: number;
    totalMenuCents: number;
  };
  addOnCosts: {
    itemBreakdown: Array<{
      addOnId: string;
      name: string;
      quantity: number;
      unitPriceCents: number;
      totalCents: number;
    }>;
    totalAddOnCents: number;
  };
  hungerMultiplier: number;
  distanceDetails: {
    miles: number;
    feePerMile: number;
    withinDeliveryRadius: boolean;
  };
  taxDetails: {
    taxRate: number;
    taxableAmountCents: number;
  };
  depositDetails: {
    depositRate: number;
    depositAmountCents: number;
  };
}

/**
 * Error class for pricing calculation errors
 */
export class PricingCalculationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PricingCalculationError';
  }
}

/**
 * Validates that all required products and add-ons exist and have valid pricing
 */
function validatePricingInputs(input: PricingCalculationInput): void {
  const { guestCount, distanceMiles, menuSelections, addOns, adminSettings, products, cateringAddons } = input;

  // Validate basic inputs
  if (guestCount <= 0) {
    throw new PricingCalculationError('Guest count must be greater than 0', 'INVALID_GUEST_COUNT');
  }

  if (distanceMiles < 0) {
    throw new PricingCalculationError('Distance cannot be negative', 'INVALID_DISTANCE');
  }

  if (menuSelections.length === 0) {
    throw new PricingCalculationError('At least one menu selection is required', 'NO_MENU_SELECTIONS');
  }

  // Validate menu selections have corresponding products
  for (const selection of menuSelections) {
    if (selection.quantity <= 0) {
      throw new PricingCalculationError(`Invalid quantity for menu selection: ${selection.quantity}`, 'INVALID_MENU_QUANTITY');
    }

    const proteinProduct = products.find(p => p.id === selection.proteinId);
    const sideProduct = products.find(p => p.id === selection.sideId);

    if (!proteinProduct) {
      throw new PricingCalculationError(`Protein product not found: ${selection.proteinId}`, 'PROTEIN_NOT_FOUND');
    }

    if (!sideProduct) {
      throw new PricingCalculationError(`Side product not found: ${selection.sideId}`, 'SIDE_NOT_FOUND');
    }

    // Validate products have valid pricing
    if (!proteinProduct.variants?.length || !proteinProduct.variants[0].prices?.length) {
      throw new PricingCalculationError(`Protein product has no valid pricing: ${selection.proteinId}`, 'PROTEIN_NO_PRICING');
    }

    if (!sideProduct.variants?.length || !sideProduct.variants[0].prices?.length) {
      throw new PricingCalculationError(`Side product has no valid pricing: ${selection.sideId}`, 'SIDE_NO_PRICING');
    }
  }

  // Validate add-ons
  for (const addOn of addOns) {
    if (addOn.quantity <= 0) {
      throw new PricingCalculationError(`Invalid quantity for add-on: ${addOn.quantity}`, 'INVALID_ADDON_QUANTITY');
    }

    const cateringAddon = cateringAddons.find(a => a.id === addOn.addOnId);
    if (!cateringAddon) {
      throw new PricingCalculationError(`Add-on not found: ${addOn.addOnId}`, 'ADDON_NOT_FOUND');
    }

    if (!cateringAddon.isActive) {
      throw new PricingCalculationError(`Add-on is not active: ${addOn.addOnId}`, 'ADDON_INACTIVE');
    }
  }

  // Validate admin settings
  if (!adminSettings.hungerMultipliers[input.hungerLevel]) {
    throw new PricingCalculationError(`Invalid hunger level: ${input.hungerLevel}`, 'INVALID_HUNGER_LEVEL');
  }

  if (adminSettings.taxRate < 0 || adminSettings.taxRate > 1) {
    throw new PricingCalculationError('Tax rate must be between 0 and 1', 'INVALID_TAX_RATE');
  }

  if (adminSettings.depositPercentage < 0 || adminSettings.depositPercentage > 1) {
    throw new PricingCalculationError('Deposit percentage must be between 0 and 1', 'INVALID_DEPOSIT_PERCENTAGE');
  }
}

/**
 * Extracts the price in cents from a product variant
 */
function getProductPriceCents(product: Product): number {
  const variant = product.variants?.[0];
  if (!variant || !variant.prices?.length) {
    throw new PricingCalculationError(`No pricing found for product: ${product.id}`, 'NO_PRODUCT_PRICING');
  }

  // Find USD price or use the first available price
  const usdPrice = variant.prices.find(p => p.currency_code === 'usd') || variant.prices[0];
  return usdPrice.amount;
}

/**
 * Calculates base menu costs for all selections
 */
export function calculateMenuCosts(
  menuSelections: MenuSelection[],
  products: Product[]
): { proteinCosts: number; sideCosts: number; totalMenuCents: number } {
  let proteinCosts = 0;
  let sideCosts = 0;

  for (const selection of menuSelections) {
    const proteinProduct = products.find(p => p.id === selection.proteinId);
    const sideProduct = products.find(p => p.id === selection.sideId);

    if (!proteinProduct || !sideProduct) {
      throw new PricingCalculationError('Menu selection products not found', 'MENU_PRODUCTS_NOT_FOUND');
    }

    const proteinPriceCents = getProductPriceCents(proteinProduct);
    const sidePriceCents = getProductPriceCents(sideProduct);

    proteinCosts += proteinPriceCents * selection.quantity;
    sideCosts += sidePriceCents * selection.quantity;
  }

  return {
    proteinCosts,
    sideCosts,
    totalMenuCents: proteinCosts + sideCosts
  };
}

/**
 * Calculates costs for all add-on selections
 */
export function calculateAddOnCosts(
  addOns: AddOnSelection[],
  cateringAddons: CateringAddon[]
): {
  itemBreakdown: Array<{
    addOnId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  totalAddOnCents: number;
} {
  const itemBreakdown = [];
  let totalAddOnCents = 0;

  for (const addOn of addOns) {
    const cateringAddon = cateringAddons.find(a => a.id === addOn.addOnId);
    if (!cateringAddon) {
      throw new PricingCalculationError(`Add-on not found: ${addOn.addOnId}`, 'ADDON_NOT_FOUND');
    }

    const totalCents = cateringAddon.priceCents * addOn.quantity;
    
    itemBreakdown.push({
      addOnId: addOn.addOnId,
      name: cateringAddon.name,
      quantity: addOn.quantity,
      unitPriceCents: cateringAddon.priceCents,
      totalCents
    });

    totalAddOnCents += totalCents;
  }

  return { itemBreakdown, totalAddOnCents };
}

/**
 * Applies hunger level multiplier to base costs
 */
export function applyHungerMultiplier(
  baseCostCents: number,
  hungerLevel: HungerLevel,
  adminSettings: AdminSettings
): { adjustedCostCents: number; multiplier: number } {
  const multiplier = adminSettings.hungerMultipliers[hungerLevel];
  const adjustedCostCents = Math.round(baseCostCents * multiplier);

  return { adjustedCostCents, multiplier };
}

/**
 * Calculates delivery fee based on distance and admin settings
 */
export function calculateDeliveryFee(
  distanceMiles: number,
  adminSettings: AdminSettings
): {
  deliveryFeeCents: number;
  withinRadius: boolean;
  feePerMile: number;
} {
  const withinRadius = distanceMiles <= adminSettings.deliveryRadius;
  
  if (!withinRadius) {
    throw new PricingCalculationError(
      `Delivery distance ${distanceMiles} miles exceeds maximum radius of ${adminSettings.deliveryRadius} miles`, 
      'OUTSIDE_DELIVERY_RADIUS'
    );
  }

  const deliveryFeeCents = Math.round(distanceMiles * adminSettings.baseFeePerMile);

  return {
    deliveryFeeCents,
    withinRadius,
    feePerMile: adminSettings.baseFeePerMile
  };
}

/**
 * Calculates tax on the subtotal (menu + add-ons + delivery)
 */
export function calculateTax(
  subtotalCents: number,
  adminSettings: AdminSettings
): { taxCents: number; taxRate: number } {
  const taxCents = Math.round(subtotalCents * adminSettings.taxRate);

  return {
    taxCents,
    taxRate: adminSettings.taxRate
  };
}

/**
 * Calculates deposit amount based on total cost
 */
export function calculateDeposit(
  totalCents: number,
  adminSettings: AdminSettings
): { depositCents: number; balanceCents: number; depositRate: number } {
  const depositCents = Math.round(totalCents * adminSettings.depositPercentage);
  const balanceCents = totalCents - depositCents;

  return {
    depositCents,
    balanceCents,
    depositRate: adminSettings.depositPercentage
  };
}

/**
 * Validates that the order meets minimum requirements
 */
export function validateMinimumOrder(
  totalCents: number,
  guestCount: number,
  adminSettings: AdminSettings
): void {
  if (totalCents < adminSettings.minimumOrder) {
    throw new PricingCalculationError(
      `Order total $${(totalCents / 100).toFixed(2)} is below minimum of $${(adminSettings.minimumOrder / 100).toFixed(2)}`,
      'BELOW_MINIMUM_ORDER'
    );
  }

  // Additional validation: ensure reasonable cost per guest
  const costPerGuest = totalCents / guestCount;
  const minimumPerGuest = 1000; // $10 minimum per guest

  if (costPerGuest < minimumPerGuest) {
    throw new PricingCalculationError(
      `Cost per guest $${(costPerGuest / 100).toFixed(2)} is below minimum of $${(minimumPerGuest / 100).toFixed(2)}`,
      'BELOW_MINIMUM_PER_GUEST'
    );
  }
}

/**
 * Main function to calculate comprehensive pricing breakdown
 */
export function calculatePricingBreakdown(input: PricingCalculationInput): DetailedPricingBreakdown {
  try {
    // Validate all inputs
    validatePricingInputs(input);

    const { guestCount, hungerLevel, distanceMiles, menuSelections, addOns, adminSettings, products, cateringAddons } = input;

    // Calculate base menu costs
    const baseMenuCosts = calculateMenuCosts(menuSelections, products);

    // Apply hunger multiplier to menu costs
    const { adjustedCostCents: adjustedMenuCents, multiplier: hungerMultiplier } = applyHungerMultiplier(
      baseMenuCosts.totalMenuCents,
      hungerLevel,
      adminSettings
    );

    // Calculate add-on costs
    const addOnCosts = calculateAddOnCosts(addOns, cateringAddons);

    // Calculate delivery fee
    const deliveryDetails = calculateDeliveryFee(distanceMiles, adminSettings);

    // Calculate subtotal (adjusted menu + add-ons + delivery)
    const subtotalCents = adjustedMenuCents + addOnCosts.totalAddOnCents + deliveryDetails.deliveryFeeCents;

    // Calculate tax
    const taxDetails = calculateTax(subtotalCents, adminSettings);

    // Calculate total
    const totalCents = subtotalCents + taxDetails.taxCents;

    // Validate minimum order
    validateMinimumOrder(totalCents, guestCount, adminSettings);

    // Calculate deposit and balance
    const depositDetails = calculateDeposit(totalCents, adminSettings);

    return {
      // Standard pricing breakdown
      subtotalCents,
      taxCents: taxDetails.taxCents,
      deliveryFeeCents: deliveryDetails.deliveryFeeCents,
      totalCents,
      depositCents: depositDetails.depositCents,
      balanceCents: depositDetails.balanceCents,

      // Detailed breakdown
      baseMenuCosts: {
        proteinCosts: baseMenuCosts.proteinCosts,
        sideCosts: baseMenuCosts.sideCosts,
        totalMenuCents: adjustedMenuCents // After hunger multiplier
      },
      addOnCosts,
      hungerMultiplier,
      distanceDetails: {
        miles: distanceMiles,
        feePerMile: adminSettings.baseFeePerMile,
        withinDeliveryRadius: deliveryDetails.withinRadius
      },
      taxDetails: {
        taxRate: taxDetails.taxRate,
        taxableAmountCents: subtotalCents
      },
      depositDetails: {
        depositRate: depositDetails.depositRate,
        depositAmountCents: depositDetails.depositCents
      }
    };

  } catch (error) {
    if (error instanceof PricingCalculationError) {
      throw error;
    }
    
    // Wrap unexpected errors
    throw new PricingCalculationError(
      `Unexpected error during pricing calculation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CALCULATION_ERROR'
    );
  }
}

/**
 * Simplified pricing calculation that returns just the basic breakdown
 */
export function calculateSimplePricing(input: PricingCalculationInput): PricingBreakdown {
  const detailed = calculatePricingBreakdown(input);
  
  return {
    subtotalCents: detailed.subtotalCents,
    taxCents: detailed.taxCents,
    deliveryFeeCents: detailed.deliveryFeeCents,
    totalCents: detailed.totalCents,
    depositCents: detailed.depositCents,
    balanceCents: detailed.balanceCents
  };
}

/**
 * Utility function to format pricing breakdown for display
 */
export function formatPricingDisplay(pricing: PricingBreakdown): {
  subtotal: string;
  tax: string;
  delivery: string;
  total: string;
  deposit: string;
  balance: string;
} {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return {
    subtotal: formatter.format(pricing.subtotalCents / 100),
    tax: formatter.format(pricing.taxCents / 100),
    delivery: formatter.format(pricing.deliveryFeeCents / 100),
    total: formatter.format(pricing.totalCents / 100),
    deposit: formatter.format(pricing.depositCents / 100),
    balance: formatter.format(pricing.balanceCents / 100)
  };
}

/**
 * Calculates estimated cost per guest for display purposes
 */
export function calculateCostPerGuest(totalCents: number, guestCount: number): {
  costPerGuestCents: number;
  formatted: string;
} {
  const costPerGuestCents = Math.round(totalCents / guestCount);
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return {
    costPerGuestCents,
    formatted: formatter.format(costPerGuestCents / 100)
  };
}

/**
 * Validates if delivery is possible to the given distance
 */
export function isDeliveryAvailable(distanceMiles: number, adminSettings: AdminSettings): {
  available: boolean;
  reason?: string;
  maxDistance: number;
} {
  const available = distanceMiles <= adminSettings.deliveryRadius;
  
  return {
    available,
    reason: available ? undefined : `Location is ${distanceMiles} miles away, maximum delivery distance is ${adminSettings.deliveryRadius} miles`,
    maxDistance: adminSettings.deliveryRadius
  };
}