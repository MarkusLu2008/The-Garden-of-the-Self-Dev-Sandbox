import type { QuestSeedItem, QuestDuration, GenerateSettings } from './questTypes';
import { VIRTUES, COMPANION_GRAPH } from './virtues';

const DURATIONS: QuestDuration[] = ['Short', 'Medium', 'Long'];

function getPrimaryVirtue(quest: QuestSeedItem): string {
  const entries = Object.entries(quest.virtues);
  if (entries.length === 0) return '';
  return entries.sort(([, a], [, b]) => b - a)[0][0];
}

export function autoSuggestConfig(quests: QuestSeedItem[]): Omit<GenerateSettings, 'count'> {
  // Count (primaryVirtue, duration) pairs
  const counts: Record<string, Record<QuestDuration, number>> = {};
  for (const virtue of VIRTUES) {
    counts[virtue] = { Short: 0, Medium: 0, Long: 0 };
  }

  for (const quest of quests) {
    const primary = getPrimaryVirtue(quest);
    if (primary && counts[primary]) {
      counts[primary][quest.duration]++;
    }
  }

  // Find the (virtue, duration) pair(s) with the lowest count
  let minCount = Infinity;
  const candidates: Array<{ virtue: string; duration: QuestDuration }> = [];

  for (const virtue of VIRTUES) {
    for (const duration of DURATIONS) {
      const count = counts[virtue][duration];
      if (count < minCount) {
        minCount = count;
        candidates.length = 0;
        candidates.push({ virtue, duration });
      } else if (count === minCount) {
        candidates.push({ virtue, duration });
      }
    }
  }

  const { virtue, duration } = candidates[Math.floor(Math.random() * candidates.length)];

  // Pick 0–2 secondary virtues from valid companions
  const companions = COMPANION_GRAPH[virtue] ?? [];
  const numSecondaries = Math.floor(Math.random() * 3); // 0, 1, or 2
  const shuffled = [...companions].sort(() => Math.random() - 0.5);
  const secondaryVirtues = shuffled.slice(0, numSecondaries);

  return { primaryVirtue: virtue, secondaryVirtues, duration };
}
