import test from 'node:test';
import assert from 'node:assert/strict';

import { autoSuggestConfig } from './autoSuggest';
import type { QuestDuration, QuestSeedItem } from './questTypes';
import { COMPANION_GRAPH, getVirtueDistanceFromCuriosity } from './virtues';

const DURATIONS: QuestDuration[] = ['Short', 'Medium', 'Long'];

function buildSecondaryOptions(primaryVirtue: string): string[][] {
  const companions = [...(COMPANION_GRAPH[primaryVirtue] ?? [])].sort();
  const options: string[][] = [[]];

  for (let i = 0; i < companions.length; i += 1) {
    options.push([companions[i]]);
  }
  for (let i = 0; i < companions.length; i += 1) {
    for (let j = i + 1; j < companions.length; j += 1) {
      options.push([companions[i], companions[j]]);
    }
  }

  return options;
}

function buildCoverageQuestsForPrimary(primaryVirtue: string): QuestSeedItem[] {
  const quests: QuestSeedItem[] = [];
  for (const secondaryVirtues of buildSecondaryOptions(primaryVirtue)) {
    for (const duration of DURATIONS) {
      const virtues: Record<string, number> = {
        [primaryVirtue]: 10,
      };
      for (const secondary of secondaryVirtues) virtues[secondary] = 1;

      quests.push({
        prompt: `${primaryVirtue}::${secondaryVirtues.join('|')}::${duration}`,
        virtues,
        duration,
      });
    }
  }
  return quests;
}

test('keeps least-used combos as primary priority', () => {
  const quests: QuestSeedItem[] = [
    ...buildCoverageQuestsForPrimary('Curiosity'),
    ...buildCoverageQuestsForPrimary('Courage'),
    ...buildCoverageQuestsForPrimary('Proper Ambition'),
  ];

  const result = autoSuggestConfig(quests);
  const distance = getVirtueDistanceFromCuriosity(result.primaryVirtue);

  // If min-count is truly primary, it should select an uncovered combo (distance >= 2),
  // not the closer root-adjacent virtues whose combos were all already used.
  assert.ok(distance >= 2);
});

test('uses Curiosity BFS distance as secondary tie-break among least-used combos', () => {
  const quests: QuestSeedItem[] = [...buildCoverageQuestsForPrimary('Curiosity')];
  const result = autoSuggestConfig(quests);
  const distance = getVirtueDistanceFromCuriosity(result.primaryVirtue);

  // Curiosity combos are covered; among the remaining least-used combos,
  // distance-1 virtues should win over farther ones.
  assert.equal(distance, 1);
});

test('keeps random tie-break when count and distance are equal', () => {
  const originalRandom = Math.random;

  try {
    Math.random = () => 0;
    const first = autoSuggestConfig([]);

    Math.random = () => 0.999999;
    const last = autoSuggestConfig([]);

    assert.equal(first.primaryVirtue, 'Curiosity');
    assert.equal(last.primaryVirtue, 'Curiosity');
    assert.notDeepEqual(first, last);
  } finally {
    Math.random = originalRandom;
  }
});
