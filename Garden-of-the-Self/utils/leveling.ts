/**
 * Pure leveling math — no imports so it can be unit-tested directly with
 * `node --test` (native type stripping). Config values are passed in by
 * callers (see utils/questScoring.ts).
 */

/** 1-indexed level derived from cumulative points against cumulative thresholds. */
export function levelFromPoints(points: number, thresholds: number[]): number {
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (points >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

/** Progress within the current level band (0–1). Returns 1.0 at max level. */
export function progressWithinLevel(points: number, thresholds: number[]): number {
  const level = levelFromPoints(points, thresholds);
  const maxLevel = thresholds.length;
  if (level >= maxLevel) return 1.0;
  const lower = thresholds[level - 1];
  const upper = thresholds[level];
  if (upper <= lower) return 1.0;
  return Math.min(1, Math.max(0, (points - lower) / (upper - lower)));
}

/** Display name for a 1-indexed level, clamped to the available names. */
export function stageNameForLevel(level: number, names: string[]): string {
  const idx = Math.max(0, Math.min(names.length - 1, level - 1));
  return names[idx];
}

export type PacingRow = {
  level: number;
  thresholdPoints: number;
  days: number;
};

/**
 * Days needed to reach each level when completing `dailyCap` quests per day
 * worth `pointsPerQuest` each (spec section 2.3 pacing sanity-check).
 */
export function pacingTable(
  pointsPerQuest: number,
  dailyCap: number,
  thresholds: number[]
): PacingRow[] {
  const pointsPerDay = pointsPerQuest * dailyCap;
  const rows: PacingRow[] = [];
  for (let level = 2; level <= thresholds.length; level++) {
    const thresholdPoints = thresholds[level - 1];
    rows.push({
      level,
      thresholdPoints,
      days: Math.ceil(thresholdPoints / pointsPerDay),
    });
  }
  return rows;
}
