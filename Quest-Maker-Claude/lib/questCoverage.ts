import type { QuestDuration, QuestSeedItem } from './questTypes';
import { COMPANION_GRAPH, VIRTUES } from './virtues';

const DURATIONS: QuestDuration[] = ['Short', 'Medium', 'Long'];

function getPrimaryVirtue(quest: QuestSeedItem): string {
  const entries = Object.entries(quest.virtues);
  if (entries.length === 0) return '';
  return entries.sort(([, a], [, b]) => b - a)[0][0];
}

function sortVirtues(virtues: string[]): string[] {
  const rank = new Map(VIRTUES.map((v, idx) => [v, idx]));
  return [...virtues].sort(
    (a, b) => (rank.get(a) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b) ?? Number.MAX_SAFE_INTEGER)
  );
}

function buildSecondaryOptions(primaryVirtue: string): string[][] {
  const companions = sortVirtues(COMPANION_GRAPH[primaryVirtue] ?? []);
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

function comboKey(primaryVirtue: string, secondaryVirtues: string[], duration: QuestDuration): string {
  return `${primaryVirtue}::${sortVirtues(secondaryVirtues).join('|')}::${duration}`;
}

export function getTotalPossibleCombos(): number {
  let total = 0;
  for (const virtue of VIRTUES) {
    const secondaryCount = buildSecondaryOptions(virtue).length;
    total += secondaryCount * DURATIONS.length;
  }
  return total;
}

export function getCoveredComboCount(quests: QuestSeedItem[]): number {
  const covered = new Set<string>();

  for (const quest of quests) {
    const primaryVirtue = getPrimaryVirtue(quest);
    if (!primaryVirtue || !VIRTUES.includes(primaryVirtue as (typeof VIRTUES)[number])) continue;

    const secondaries = sortVirtues(
      Object.keys(quest.virtues).filter((virtue) => virtue !== primaryVirtue)
    );

    if (secondaries.length > 2) continue;

    const companionSet = new Set(COMPANION_GRAPH[primaryVirtue] ?? []);
    if (secondaries.some((virtue) => !companionSet.has(virtue))) continue;

    covered.add(comboKey(primaryVirtue, secondaries, quest.duration));
  }

  return covered.size;
}
