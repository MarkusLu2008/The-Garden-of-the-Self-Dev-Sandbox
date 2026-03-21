import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { QuestSeedItem } from '@/lib/seed-types';

export type MergeResult = {
  nextContent: string;
  added: QuestSeedItem[];
  skipped: QuestSeedItem[];
};

export function resolveSeedFilePath(): string {
  return path.resolve(process.cwd(), '..', 'Garden-of-the-Self', 'data', 'quests-seed.ts');
}

function formatQuestEntry(quest: QuestSeedItem): string {
  const sortedVirtues = Object.entries(quest.virtues).sort((a, b) => b[1] - a[1]);
  const virtuesString = sortedVirtues
    .map(([virtue, value]) => `${JSON.stringify(virtue)}: ${Math.round(value)}`)
    .join(', ');
  return [
    '  {',
    `    prompt: ${JSON.stringify(quest.prompt)},`,
    `    virtues: { ${virtuesString} },`,
    `    duration: ${JSON.stringify(quest.duration)},`,
    '  },',
  ].join('\n');
}

export function buildQuestSeedSnippet(quests: QuestSeedItem[]): string {
  return quests.map(formatQuestEntry).join('\n');
}

export function mergeQuestsIntoSeed(currentContent: string, questsToAdd: QuestSeedItem[]): MergeResult {
  const startMarker = 'export const questsSeed: QuestSeedItem[] = [';
  const endMarker = '];';
  const startIndex = currentContent.indexOf(startMarker);
  const endIndex = currentContent.lastIndexOf(endMarker);

  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    throw new Error('Could not locate questsSeed array boundaries in quests-seed.ts.');
  }

  const existingPrompts = new Set<string>();
  const promptRegex = /prompt:\s*(['"`])([\s\S]*?)\1/g;
  let match = promptRegex.exec(currentContent);
  while (match) {
    existingPrompts.add(match[2].trim().toLowerCase());
    match = promptRegex.exec(currentContent);
  }

  const added: QuestSeedItem[] = [];
  const skipped: QuestSeedItem[] = [];
  for (const quest of questsToAdd) {
    const key = quest.prompt.trim().toLowerCase();
    if (!key || existingPrompts.has(key)) {
      skipped.push(quest);
      continue;
    }
    existingPrompts.add(key);
    added.push(quest);
  }

  if (added.length === 0) {
    return { nextContent: currentContent, added, skipped };
  }

  const insertion = `\n${buildQuestSeedSnippet(added)}\n`;
  const nextContent = `${currentContent.slice(0, endIndex)}${insertion}${currentContent.slice(endIndex)}`;
  return { nextContent, added, skipped };
}

export function buildDiffPreview(previousContent: string, nextContent: string, maxLines = 120): string {
  if (previousContent === nextContent) {
    return 'No file changes.';
  }

  const beforeLines = previousContent.split('\n');
  const afterLines = nextContent.split('\n');
  const removed = beforeLines.filter((line) => !afterLines.includes(line)).map((line) => `- ${line}`);
  const added = afterLines.filter((line) => !beforeLines.includes(line)).map((line) => `+ ${line}`);
  return [...removed, ...added].slice(0, maxLines).join('\n');
}

export async function loadSeedFileContent(seedFilePath = resolveSeedFilePath()): Promise<string> {
  return readFile(seedFilePath, 'utf8');
}

export async function persistSeedFileContent(
  nextContent: string,
  seedFilePath = resolveSeedFilePath(),
): Promise<void> {
  await writeFile(seedFilePath, nextContent, 'utf8');
}
