import { gameConfig } from '@/constants/gameConfig';
import type { QuestDifficultyTier } from '@/data/quests-seed';
import { levelFromPoints, pacingTable, progressWithinLevel, stageNameForLevel } from '@/utils/leveling';

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
  return levelFromPoints(specPoints, gameConfig.quests.difficultyTiers.levelThresholds);
}

/** Progress within the current level band (0–1). Returns 1.0 at max level. */
export function levelProgress(specPoints: number): number {
  return progressWithinLevel(specPoints, gameConfig.quests.difficultyTiers.levelThresholds);
}

/** Display name for a given 1-indexed level. */
export function levelStageName(level: number): string {
  return stageNameForLevel(level, gameConfig.quests.difficultyTiers.levelStageNames);
}

/** Dev-only pacing sanity check. Logs days-to-level for each difficulty tier. */
export function pacingCheck(): void {
  if (!__DEV__) return;
  const { pointsPerTier, dailyCapPerVirtue, levelThresholds } = gameConfig.quests.difficultyTiers;
  const tiers = ['gentle', 'moderate', 'stretch'] as const;
  for (const tier of tiers) {
    const pts = pointsPerTier[tier];
    console.log(`\n-- ${tier} (${pts} pts/quest, cap ${dailyCapPerVirtue}/day) --`);
    for (const row of pacingTable(pts, dailyCapPerVirtue, levelThresholds)) {
      console.log(`  Level ${row.level} (${row.thresholdPoints} pts): ~${row.days} days`);
    }
  }
}
