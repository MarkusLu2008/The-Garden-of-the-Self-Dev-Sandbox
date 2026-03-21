import type { QuestSeedItem, QuestDuration, GenerateSettings } from './questTypes';
import { VIRTUES, COMPANION_GRAPH } from './virtues';

const DURATIONS: QuestDuration[] = ['Short', 'Medium', 'Long'];

type SuggestionCombo = {
  primaryVirtue: string;
  secondaryVirtues: string[];
  duration: QuestDuration;
};

function getPrimaryVirtue(quest: QuestSeedItem): string {
  const entries = Object.entries(quest.virtues);
  if (entries.length === 0) return '';
  return entries.sort(([, a], [, b]) => b - a)[0][0];
}

function sortVirtues(virtues: string[]): string[] {
  const rank = new Map(VIRTUES.map((v, idx) => [v, idx]));
  return [...virtues].sort((a, b) => (rank.get(a) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b) ?? Number.MAX_SAFE_INTEGER));
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

function comboKey(combo: SuggestionCombo): string {
  const secondaries = sortVirtues(combo.secondaryVirtues).join('|');
  return `${combo.primaryVirtue}::${secondaries}::${combo.duration}`;
}

function parseComboFromQuest(quest: QuestSeedItem): SuggestionCombo | null {
  const primaryVirtue = getPrimaryVirtue(quest);
  if (!primaryVirtue || !VIRTUES.includes(primaryVirtue as (typeof VIRTUES)[number])) return null;

  const companionSet = new Set(COMPANION_GRAPH[primaryVirtue] ?? []);
  const secondaries = sortVirtues(
    Object.keys(quest.virtues).filter((virtue) => virtue !== primaryVirtue)
  );

  // Only count quests that match the companion-graph model (0-2 valid companions).
  if (secondaries.length > 2) return null;
  if (secondaries.some((virtue) => !companionSet.has(virtue))) return null;

  return {
    primaryVirtue,
    secondaryVirtues: secondaries,
    duration: quest.duration,
  };
}

export function autoSuggestConfig(
  quests: QuestSeedItem[]
): Omit<GenerateSettings, 'count' | 'autoSuggestBeforeGenerate'> {
  // Build the full set of companion-graph combinations across all durations.
  const allCombos: SuggestionCombo[] = [];
  for (const virtue of VIRTUES) {
    const secondaryOptions = buildSecondaryOptions(virtue);
    for (const secondaryVirtues of secondaryOptions) {
      for (const duration of DURATIONS) {
        allCombos.push({ primaryVirtue: virtue, secondaryVirtues, duration });
      }
    }
  }

  const counts = new Map<string, number>();
  for (const combo of allCombos) counts.set(comboKey(combo), 0);

  // Count existing quests that map to valid companion-graph combinations.
  for (const quest of quests) {
    const combo = parseComboFromQuest(quest);
    if (!combo) continue;
    const key = comboKey(combo);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Find combination(s) with the lowest count and randomly pick one.
  let minCount = Infinity;
  const candidates: SuggestionCombo[] = [];
  for (const combo of allCombos) {
    const count = counts.get(comboKey(combo)) ?? 0;
    if (count < minCount) {
      minCount = count;
      candidates.length = 0;
      candidates.push(combo);
    } else if (count === minCount) {
      candidates.push(combo);
    }
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    primaryVirtue: selected.primaryVirtue,
    secondaryVirtues: selected.secondaryVirtues,
    duration: selected.duration,
  };
}
