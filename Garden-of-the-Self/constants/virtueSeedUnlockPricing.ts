export type VirtueSeedUnlockPricingConfig = {
  /** Price at graph distance 1. */
  basePriceDistance1: number;
  /** Exponential growth multiplier per extra distance step. */
  multiplier: number;
  /** Optional clamp after rounding. */
  minPrice?: number;
  /** Optional clamp after rounding. */
  maxPrice?: number;
};

/**
 * Tweak these values to tune seed unlock progression.
 * Unlock price formula (distance >= 1):
 *   round(basePriceDistance1 * multiplier^(distance - 1))
 */
export const VIRTUE_SEED_UNLOCK_PRICING: VirtueSeedUnlockPricingConfig = {
  basePriceDistance1: 5,
  multiplier: 1.75,
  minPrice: 1,
};

