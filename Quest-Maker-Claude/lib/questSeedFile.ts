import fs from 'node:fs';
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import type { QuestSeedItem } from '@/lib/questTypes';

const SEED_ARRAY_MARKER = 'export const questsSeed: QuestSeedItem[] = [';

export type MergeResult = {
  nextContent: string;
  added: QuestSeedItem[];
  skipped: QuestSeedItem[];
};

export function resolveSeedFilePath(): string {
  return path.resolve(process.cwd(), '..', 'Garden-of-the-Self', 'data', 'quests-seed.ts');
}

export function parseQuestsSeedContent(content: string): QuestSeedItem[] {
  const markerIndex = content.indexOf(SEED_ARRAY_MARKER);
  const arrayStart = content.indexOf('[', markerIndex);
  const endIndex = content.lastIndexOf('];');
  if (markerIndex < 0 || arrayStart < 0 || endIndex < 0 || endIndex <= arrayStart) {
    throw new Error('Could not locate questsSeed array boundaries in quests-seed.ts.');
  }

  const arrayLiteral = content.slice(arrayStart, endIndex + 1);
  const script = new vm.Script(`(${arrayLiteral})`);
  const parsed = script.runInNewContext({}) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('questsSeed is not an array.');
  }

  return parsed as QuestSeedItem[];
}

function formatQuestEntry(quest: QuestSeedItem): string {
  const sortedVirtues = Object.entries(quest.virtues).sort(
    ([nameA, valueA], [nameB, valueB]) => valueB - valueA || nameA.localeCompare(nameB),
  );
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

function normalizePrompt(prompt: string): string {
  return prompt.trim().toLowerCase();
}

export function readSeedQuestsSync(seedFilePath = resolveSeedFilePath()): QuestSeedItem[] {
  const content = fs.readFileSync(seedFilePath, 'utf8');
  return parseQuestsSeedContent(content);
}

export async function loadSeedFileContent(seedFilePath = resolveSeedFilePath()): Promise<string> {
  return readFile(seedFilePath, 'utf8');
}

export function mergeQuestsIntoSeed(currentContent: string, questsToAdd: QuestSeedItem[]): MergeResult {
  const existing = parseQuestsSeedContent(currentContent);
  const existingPrompts = new Set(existing.map((quest) => normalizePrompt(quest.prompt)));

  const added: QuestSeedItem[] = [];
  const skipped: QuestSeedItem[] = [];
  for (const quest of questsToAdd) {
    const promptKey = normalizePrompt(quest.prompt);
    if (!promptKey || existingPrompts.has(promptKey)) {
      skipped.push(quest);
      continue;
    }

    existingPrompts.add(promptKey);
    added.push(quest);
  }

  if (added.length === 0) {
    return { nextContent: currentContent, added, skipped };
  }

  const endIndex = currentContent.lastIndexOf('];');
  if (endIndex < 0) {
    throw new Error('Could not locate questsSeed array end marker.');
  }

  const insertion = `\n${added.map(formatQuestEntry).join('\n')}\n`;
  const nextContent = `${currentContent.slice(0, endIndex)}${insertion}${currentContent.slice(endIndex)}`;
  return { nextContent, added, skipped };
}

export async function persistSeedFileContentAtomic(
  nextContent: string,
  seedFilePath = resolveSeedFilePath(),
): Promise<void> {
  const tempPath = `${seedFilePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, nextContent, 'utf8');
  await rename(tempPath, seedFilePath);
}
