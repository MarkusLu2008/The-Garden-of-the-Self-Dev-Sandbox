import { gameConfig } from '@/constants/gameConfig';
import type { QuestDifficultyTier } from '@/data/quests-seed';

/** Dominant virtue = the one with the highest reward value. */
export function getDominantVirtue(virtues: Record<string, number>): string | null {
  let dominant: string | null = null;
  let highest = 0;
  for (const [name, value] of Object.entries(virtues)) {
    if (value > highest) {
      dominant = name;
      highest = value;
    }
  }
  return dominant;
}

/** Spec-points awarded for a given difficulty tier. */
export function specPointsForTier(tier: QuestDifficultyTier): number {
  const key = tier.toLowerCase() as 'gentle' | 'moderate' | 'stretch';
  return gameConfig.quests.difficultyTiers.pointsPerTier[key];
}

/** 1-indexed level (1–7) derived from cumulative spec-points. */
export function specPointsToLevel(specPoints: number): number {
  const thresholds = gameConfig.quests.difficultyTiers.levelThresholds;
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (specPoints >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

/** Progress within the current level band (0–1). Returns 1.0 at max level. */
export function levelProgress(specPoints: number): number {
  const thresholds = gameConfig.quests.difficultyTiers.levelThresholds;
  const level = specPointsToLevel(specPoints);
  const maxLevel = thresholds.length;
  if (level >= maxLevel) return 1.0;
  const lower = thresholds[level - 1];
  const upper = thresholds[level];
  if (upper <= lower) return 1.0;
  return Math.min(1, (specPoints - lower) / (upper - lower));
}

/** Display name for a given 1-indexed level. */
export function levelStageName(level: number): string {
  const names = gameConfig.quests.difficultyTiers.levelStageNames;
  const idx = Math.max(0, Math.min(names.length - 1, level - 1));
  return names[idx];
}

/** Dev-only pacing sanity check. Logs days-to-level for each difficulty tier. */
export function pacingCheck(): void {
  if (!__DEV__) return;
  const { pointsPerTier, dailyCapPerVirtue, levelThresholds } = gameConfig.quests.difficultyTiers;
  const tiers = ['gentle', 'moderate', 'stretch'] as const;
  for (const tier of tiers) {
    const pts = pointsPerTier[tier];
    const ptsPerDay = pts * dailyCapPerVirtue;
    console.log(`\n-- ${tier} (${pts} pts/quest, cap ${dailyCapPerVirtue}/day = ${ptsPerDay} pts/day) --`);
    for (let lvl = 2; lvl <= levelThresholds.length; lvl++) {
      const target = levelThresholds[lvl - 1];
      const days = Math.ceil(target / ptsPerDay);
      console.log(`  Level ${lvl} (${target} pts): ~${days} days`);
    }
  }
}
