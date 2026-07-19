// Relative .ts import (not @/ alias) so `node --test` can load this module.
import { addDaysToDateString } from './dateUtils.ts';

/**
 * Adaptive difficulty (Phase 10) — a per-virtue streak ladder.
 *
 * Model (deliberately simple, streak-focused):
 * - Complete quests at (or above) the suggested tier on N consecutive days
 *   → the suggested tier moves up one step (Gentle → Moderate → Stretch).
 * - Rerolling a quest ("this is too much today") drops the virtue straight
 *   back to Gentle and resets the ladder.
 * - Completions below the suggested tier neither advance nor reset the run.
 * - The user can override the suggestion per virtue at any time; the ladder
 *   keeps running underneath so removing the override falls back to it.
 *
 * Pure functions only — persistence lives in services/db.ts.
 */

export type DifficultyTierName = 'Gentle' | 'Moderate' | 'Stretch';

export const tierOrder: DifficultyTierName[] = ['Gentle', 'Moderate', 'Stretch'];

export function tierRank(tier: DifficultyTierName): number {
  return tierOrder.indexOf(tier);
}

export function nextTierUp(tier: DifficultyTierName): DifficultyTierName {
  const index = tierRank(tier);
  return tierOrder[Math.min(index + 1, tierOrder.length - 1)];
}

export type AdaptiveState = {
  suggestedTier: DifficultyTierName;
  /** Consecutive days (ending at lastCountedDate) with a qualifying completion. */
  consecutiveDays: number;
  /** Last YYYY-MM-DD date that counted toward the run; null before any completion. */
  lastCountedDate: string | null;
};

export const initialAdaptiveState: AdaptiveState = {
  suggestedTier: 'Gentle',
  consecutiveDays: 0,
  lastCountedDate: null,
};

/**
 * Fold one completion into the ladder. Only the first qualifying completion
 * per day counts; a gap of more than one day restarts the run at 1.
 */
export function applyCompletion(
  state: AdaptiveState,
  completedTier: DifficultyTierName,
  date: string,
  promoteAfterDays: number
): AdaptiveState {
  if (tierRank(completedTier) < tierRank(state.suggestedTier)) return state;
  if (state.lastCountedDate === date) return state;

  const continuesRun = state.lastCountedDate === addDaysToDateString(date, -1);
  const run = continuesRun ? state.consecutiveDays + 1 : 1;

  if (run >= promoteAfterDays && state.suggestedTier !== 'Stretch') {
    return { suggestedTier: nextTierUp(state.suggestedTier), consecutiveDays: 0, lastCountedDate: date };
  }
  return { ...state, consecutiveDays: run, lastCountedDate: date };
}

/** A skip (reroll) sends the virtue back to the gentle-only zone. */
export function applySkip(state: AdaptiveState): AdaptiveState {
  return { ...state, suggestedTier: 'Gentle', consecutiveDays: 0 };
}

export function normalizeTier(value: string | null | undefined): DifficultyTierName | null {
  if (value === 'Gentle' || value === 'Moderate' || value === 'Stretch') return value;
  return null;
}
