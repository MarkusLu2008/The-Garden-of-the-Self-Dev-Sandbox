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

export type StreakMilestone = {
  /** Current streak length that triggers this milestone (once ever). */
  days: number;
  /** Streak freezes granted when reached. */
  freezes: number;
  /** Stable id recorded as a cosmetic unlock. */
  cosmetic: string;
  /** Display name for celebration + badges. */
  label: string;
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
    difficultyTiers: {
      pointsPerTier: { gentle: number; moderate: number; stretch: number };
      /** Max times a single virtue can earn spec points per calendar day. */
      dailyCapPerVirtue: number;
      /** Cumulative spec-point thresholds for levels 1–7. Index = level - 1. */
      levelThresholds: number[];
      /** Display name for each level (index = level - 1). */
      levelStageNames: string[];
    };
  };
  streak: {
    /** Freezes a fresh install starts with (grace for one missed day). */
    initialFreezes: number;
    /** Spec-points bonus for the first completed quest of each day (spec 2.4). */
    dailyBonusPoints: number;
    milestones: StreakMilestone[];
  };
  wilting: {
    /** Days without spec-point activity before a virtue's plant wilts (spec: 5–7). */
    staleDays: number;
  };
  notifications: {
    /** Default hour (24h clock) for the daily reminder. */
    defaultDailyReminderHour: number;
    /** Default hour (24h clock) for the streak-protection reminder. */
    defaultStreakReminderHour: number;
    /** Reminders are never scheduled inside this window (start may wrap past midnight). */
    quietHours: { startHour: number; endHour: number };
    /** Progress-within-level fraction that counts as "near level-up" for reminder copy. */
    nearLevelUpProgress: number;
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
    difficultyTiers: {
      pointsPerTier: { gentle: 10, moderate: 25, stretch: 50 },
      dailyCapPerVirtue: 2,
      levelThresholds: [0, 50, 150, 350, 700, 1250, 2100],
      levelStageNames: ['Seedling', 'Sprouting', 'Growing', 'Budding', 'Flourishing', 'Thriving', 'Radiant'],
    },
  },
  streak: {
    initialFreezes: 1,
    dailyBonusPoints: 5,
    milestones: [
      { days: 7, freezes: 1, cosmetic: 'bronze_leaf', label: 'Bronze Leaf' },
      { days: 30, freezes: 1, cosmetic: 'silver_bloom', label: 'Silver Bloom' },
      { days: 100, freezes: 2, cosmetic: 'golden_tree', label: 'Golden Tree' },
    ],
  },
  wilting: {
    staleDays: 6,
  },
  notifications: {
    defaultDailyReminderHour: 9,
    defaultStreakReminderHour: 20,
    quietHours: { startHour: 22, endHour: 8 },
    nearLevelUpProgress: 0.8,
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
    // typeof guard keeps this module importable outside React Native (node --test).
    show: typeof __DEV__ !== 'undefined' && __DEV__,
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
