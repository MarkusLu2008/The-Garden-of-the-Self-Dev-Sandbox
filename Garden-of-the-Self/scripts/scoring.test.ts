/**
 * Pacing sanity-check for the spec section 2.3 leveling numbers.
 * Run with: npm run test:scoring  (Node >= 22.6, native type stripping)
 *
 * The config numbers are intentionally duplicated here: this test pins the
 * spec values, so a config drift shows up as a failure.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  levelFromPoints,
  pacingTable,
  progressWithinLevel,
  stageNameForLevel,
} from '../utils/leveling.ts';

const THRESHOLDS = [0, 50, 150, 350, 700, 1250, 2100];
const STAGE_NAMES = ['Seedling', 'Sprouting', 'Growing', 'Budding', 'Flourishing', 'Thriving', 'Radiant'];
const POINTS = { gentle: 10, moderate: 25, stretch: 50 };
const DAILY_CAP = 2;

test('level boundaries match spec thresholds', () => {
  assert.equal(levelFromPoints(0, THRESHOLDS), 1);
  assert.equal(levelFromPoints(49, THRESHOLDS), 1);
  assert.equal(levelFromPoints(50, THRESHOLDS), 2);
  assert.equal(levelFromPoints(149, THRESHOLDS), 2);
  assert.equal(levelFromPoints(150, THRESHOLDS), 3);
  assert.equal(levelFromPoints(350, THRESHOLDS), 4);
  assert.equal(levelFromPoints(700, THRESHOLDS), 5);
  assert.equal(levelFromPoints(1250, THRESHOLDS), 6);
  assert.equal(levelFromPoints(2099, THRESHOLDS), 6);
  assert.equal(levelFromPoints(2100, THRESHOLDS), 7);
  assert.equal(levelFromPoints(99999, THRESHOLDS), 7);
});

test('progress is within the current level band only', () => {
  assert.equal(progressWithinLevel(0, THRESHOLDS), 0);
  assert.equal(progressWithinLevel(25, THRESHOLDS), 0.5); // halfway through level 1 (0→50)
  assert.equal(progressWithinLevel(50, THRESHOLDS), 0); // fresh level 2 (50→150)
  assert.equal(progressWithinLevel(100, THRESHOLDS), 0.5);
  assert.equal(progressWithinLevel(149, THRESHOLDS), 0.99);
  assert.equal(progressWithinLevel(2100, THRESHOLDS), 1); // max level pinned at full bar
  assert.equal(progressWithinLevel(5000, THRESHOLDS), 1);
});

test('stage names map to levels and clamp out-of-range', () => {
  assert.equal(stageNameForLevel(1, STAGE_NAMES), 'Seedling');
  assert.equal(stageNameForLevel(7, STAGE_NAMES), 'Radiant');
  assert.equal(stageNameForLevel(0, STAGE_NAMES), 'Seedling');
  assert.equal(stageNameForLevel(99, STAGE_NAMES), 'Radiant');
});

test('pacing: gentle-only play reaches max level in ~105 days', () => {
  const rows = pacingTable(POINTS.gentle, DAILY_CAP, THRESHOLDS);
  assert.deepEqual(
    rows.map((r) => [r.level, r.days]),
    [
      [2, 3],
      [3, 8],
      [4, 18],
      [5, 35],
      [6, 63],
      [7, 105],
    ]
  );
});

test('pacing: moderate-only play reaches max level in ~42 days', () => {
  const rows = pacingTable(POINTS.moderate, DAILY_CAP, THRESHOLDS);
  assert.deepEqual(
    rows.map((r) => [r.level, r.days]),
    [
      [2, 1],
      [3, 3],
      [4, 7],
      [5, 14],
      [6, 25],
      [7, 42],
    ]
  );
});

test('pacing: stretch-only play reaches max level in ~21 days', () => {
  const rows = pacingTable(POINTS.stretch, DAILY_CAP, THRESHOLDS);
  assert.deepEqual(
    rows.map((r) => [r.level, r.days]),
    [
      [2, 1],
      [3, 2],
      [4, 4],
      [5, 7],
      [6, 13],
      [7, 21],
    ]
  );
});
