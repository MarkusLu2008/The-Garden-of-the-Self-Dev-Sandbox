export const VIRTUE_LIST = [
  'Courage',
  'Temperance',
  'Patience',
  'Kindness',
  'Proper Ambition',
  'Modesty',
  'Empathy',
  'Resilience',
  'Curiosity',
  'Respectfulness',
  'Tolerance',
  'Collaboration',
  'Discipline',
] as const;

export type VirtueName = (typeof VIRTUE_LIST)[number];

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

export type VirtueSeedShownConfig = {
  /**
   * Formula: threshold = baseThreshold * unlockedCount^unlockedCountExponent
   * unlockedCount is first clamped to at least minUnlockedCount.
   */
  baseThreshold: number;
  unlockedCountExponent: number;
  /** Lower bound for unlockedCount before exponent formula is applied. */
  minUnlockedCount: number;
  /** Lower bound for final computed threshold after rounding. */
  minThreshold: number;
  /** Rounding method applied to the raw threshold. */
  rounding: 'round' | 'ceil' | 'floor';
};

export type GameConfig = {
  virtues: {
    list: string[];
    defaultUnlockedVirtue: string;
  };
  unlocking: {
    /** Virtue becomes unlocked after crossing this points value. */
    unlocksAfterTotalPoints: number;
    /** Which virtue is gated for daily decay until threshold is crossed once. */
    decayGateVirtue: string;
    /** Decay gate opens after this virtue crosses this points value once. */
    decayGateOpensAfterPoints: number;
  };
  quests: {
    dailyQuestCount: number;
    rewards: {
      primary: number;
      secondary: number;
      tertiary: number;
      minReward: number;
      maxReward: number;
    };
  };
  journal: {
    totalPointsPerEntry: number;
    maxVirtuesPerEntry: number;
  };
  pricing: VirtueSeedUnlockPricingConfig;
  seedShown: VirtueSeedShownConfig;
  trees: {
    pointsPerTreeStage: number;
    asciiStageThreshold: number;
    /** Fixed points required to move from seed (stage 0) to first plant stage (stage 1). */
    seedToPlantPoints: number;
    /** Exponential multiplier for each subsequent tree image stage step cost. */
    growthMultiplier: number;
  };
  devtools: {
    show: boolean;
  };
};

export const gameConfig: GameConfig = {
  virtues: {
    list: [...VIRTUE_LIST],
    defaultUnlockedVirtue: 'Curiosity',
  },
  unlocking: {
    unlocksAfterTotalPoints: 5,
    decayGateVirtue: 'Curiosity',
    decayGateOpensAfterPoints: 5,
  },
  quests: {
    dailyQuestCount: 3,
    rewards: {
      primary: 3,
      secondary: 2,
      tertiary: 1,
      minReward: 1,
      maxReward: 10,
    },
  },
  journal: {
    totalPointsPerEntry: 5,
    maxVirtuesPerEntry: 5,
  },
  pricing: {
    basePriceDistance1: 10,
    multiplier: 3,
    minPrice: 1,
  },
  seedShown: {
    baseThreshold: 5,
    unlockedCountExponent: 1.2,
    minUnlockedCount: 1,
    minThreshold: 1,
    rounding: 'round',
  },
  trees: {
    pointsPerTreeStage: 10,
    asciiStageThreshold: 25,
    seedToPlantPoints: 5,
    growthMultiplier: 2,
  },
  devtools: {
    show: false,
  }
};

export function clampQuestReward(value: number): number {
  const { minReward, maxReward } = gameConfig.quests.rewards;
  const rounded = Math.round(value);
  return Math.min(maxReward, Math.max(minReward, rounded));
}

export function clampQuestRewards(
  virtueValues: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [name, value] of Object.entries(virtueValues)) {
    if (!Number.isFinite(value)) continue;
    const clamped = clampQuestReward(value);
    if (clamped > 0) {
      result[name] = clamped;
    }
  }
  return result;
}
