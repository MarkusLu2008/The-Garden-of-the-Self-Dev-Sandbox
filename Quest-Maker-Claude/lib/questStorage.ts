import fs from 'fs';
import path from 'path';
import type { QuestSeedItem } from './questTypes';

const QUESTS_JSONL = path.join(process.cwd(), '..', 'Garden-of-the-Self', 'data', 'quests.jsonl');

export function readQuests(): QuestSeedItem[] {
  try {
    const content = fs.readFileSync(QUESTS_JSONL, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as QuestSeedItem);
  } catch {
    return [];
  }
}

export function appendQuest(quest: QuestSeedItem): void {
  fs.appendFileSync(QUESTS_JSONL, JSON.stringify(quest) + '\n');
}
