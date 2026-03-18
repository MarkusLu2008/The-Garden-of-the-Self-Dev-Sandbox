import {
  gameConfig,
  type VirtueSeedUnlockPricingConfig,
} from '@/constants/gameConfig';

export type { VirtueSeedUnlockPricingConfig };

/** Backward-compatible export; source of truth is gameConfig.pricing. */
export const VIRTUE_SEED_UNLOCK_PRICING: VirtueSeedUnlockPricingConfig =
  gameConfig.pricing;

