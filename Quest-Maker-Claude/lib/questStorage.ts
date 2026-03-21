import type { QuestSeedItem } from './questTypes';
import { readSeedQuestsSync } from '@/lib/questSeedFile';

// quests.jsonl is intentionally deprecated. Quest-Maker-Claude now reads from quests-seed.ts.
export function readQuests(): QuestSeedItem[] {
  try {
    return readSeedQuestsSync();
  } catch {
    return [];
  }
}
