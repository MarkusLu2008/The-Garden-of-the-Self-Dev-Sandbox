/**
 * Unit tests for the adaptive-difficulty streak ladder (Phase 10).
 * Run with: npm run test:adaptive  (Node >= 22.6, native type stripping)
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyCompletion,
  applySkip,
  initialAdaptiveState,
  nextTierUp,
  normalizeTier,
  tierRank,
  type AdaptiveState,
} from '../utils/adaptiveDifficulty.ts';

const PROMOTE_AFTER = 3;

function completeDays(start: AdaptiveState, days: string[], tier: 'Gentle' | 'Moderate' | 'Stretch') {
  return days.reduce((state, day) => applyCompletion(state, tier, day, PROMOTE_AFTER), start);
}

test('tier ordering helpers', () => {
  assert.equal(tierRank('Gentle'), 0);
  assert.equal(tierRank('Stretch'), 2);
  assert.equal(nextTierUp('Gentle'), 'Moderate');
  assert.equal(nextTierUp('Moderate'), 'Stretch');
  assert.equal(nextTierUp('Stretch'), 'Stretch');
  assert.equal(normalizeTier('Moderate'), 'Moderate');
  assert.equal(normalizeTier('nonsense'), null);
  assert.equal(normalizeTier(null), null);
});

test('three consecutive qualifying days promote Gentle → Moderate', () => {
  const state = completeDays(initialAdaptiveState, ['2026-07-01', '2026-07-02', '2026-07-03'], 'Gentle');
  assert.equal(state.suggestedTier, 'Moderate');
  assert.equal(state.consecutiveDays, 0); // ladder restarts at the new tier
});

test('climbing continues: Moderate completions promote to Stretch', () => {
  let state = completeDays(initialAdaptiveState, ['2026-07-01', '2026-07-02', '2026-07-03'], 'Gentle');
  state = completeDays(state, ['2026-07-04', '2026-07-05', '2026-07-06'], 'Moderate');
  assert.equal(state.suggestedTier, 'Stretch');
});

test('a gap of more than one day restarts the run instead of continuing it', () => {
  let state = completeDays(initialAdaptiveState, ['2026-07-01', '2026-07-02'], 'Gentle');
  assert.equal(state.consecutiveDays, 2);
  state = applyCompletion(state, 'Gentle', '2026-07-05', PROMOTE_AFTER); // missed 2 days
  assert.equal(state.suggestedTier, 'Gentle');
  assert.equal(state.consecutiveDays, 1);
});

test('multiple completions on the same day count once', () => {
  let state = applyCompletion(initialAdaptiveState, 'Gentle', '2026-07-01', PROMOTE_AFTER);
  state = applyCompletion(state, 'Gentle', '2026-07-01', PROMOTE_AFTER);
  state = applyCompletion(state, 'Gentle', '2026-07-01', PROMOTE_AFTER);
  assert.equal(state.suggestedTier, 'Gentle');
  assert.equal(state.consecutiveDays, 1);
});

test('completions below the suggested tier neither advance nor reset the run', () => {
  const atModerate: AdaptiveState = {
    suggestedTier: 'Moderate',
    consecutiveDays: 2,
    lastCountedDate: '2026-07-02',
  };
  const after = applyCompletion(atModerate, 'Gentle', '2026-07-03', PROMOTE_AFTER);
  assert.deepEqual(after, atModerate);
});

test('completions above the suggested tier count toward promotion', () => {
  const state = completeDays(initialAdaptiveState, ['2026-07-01', '2026-07-02', '2026-07-03'], 'Stretch');
  assert.equal(state.suggestedTier, 'Moderate');
});

test('a skip (reroll) drops straight back to Gentle from anywhere', () => {
  const atStretch: AdaptiveState = {
    suggestedTier: 'Stretch',
    consecutiveDays: 2,
    lastCountedDate: '2026-07-10',
  };
  const after = applySkip(atStretch);
  assert.equal(after.suggestedTier, 'Gentle');
  assert.equal(after.consecutiveDays, 0);
});

test('Stretch never promotes past Stretch but keeps counting days', () => {
  let state: AdaptiveState = { suggestedTier: 'Stretch', consecutiveDays: 0, lastCountedDate: null };
  state = completeDays(state, ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04'], 'Stretch');
  assert.equal(state.suggestedTier, 'Stretch');
  assert.ok(state.consecutiveDays >= 3);
});
