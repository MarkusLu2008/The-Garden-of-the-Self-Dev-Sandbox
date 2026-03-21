import { QuestSeedItemSchema, type QuestSeedItem, type VirtueName } from '@/lib/seed-types';

export const DOMINANT_COMPANION_MAP: Record<VirtueName, VirtueName[]> = {
  Curiosity: ['Courage', 'Proper Ambition'],
  Courage: ['Curiosity', 'Proper Ambition'],
  'Proper Ambition': ['Modesty', 'Kindness', 'Discipline', 'Courage', 'Curiosity'],
  Kindness: ['Proper Ambition', 'Patience', 'Modesty', 'Collaboration', 'Empathy'],
  Modesty: ['Proper Ambition', 'Kindness', 'Respectfulness'],
  Discipline: ['Proper Ambition', 'Patience', 'Temperance', 'Resilience'],
  Resilience: ['Discipline', 'Temperance'],
  Patience: ['Kindness', 'Discipline', 'Tolerance'],
  Temperance: ['Discipline', 'Resilience', 'Tolerance'],
  Empathy: ['Collaboration', 'Tolerance', 'Kindness'],
  Collaboration: ['Empathy', 'Kindness'],
  Tolerance: ['Patience', 'Temperance', 'Respectfulness'],
  Respectfulness: ['Tolerance', 'Modesty'],
};

export type QuestNormalizationResult = {
  quest: QuestSeedItem;
  diagnostics: string[];
};

export function getAllowedVirtues(dominantVirtue: VirtueName): Set<string> {
  return new Set([dominantVirtue, ...DOMINANT_COMPANION_MAP[dominantVirtue]]);
}

export function isCompanionAllowed(dominantVirtue: VirtueName, companion: string): boolean {
  return DOMINANT_COMPANION_MAP[dominantVirtue].includes(companion as VirtueName);
}

export function normalizeQuestAgainstDominant(
  input: QuestSeedItem,
  dominantVirtue: VirtueName,
): QuestNormalizationResult {
  const diagnostics: string[] = [];
  const allowed = getAllowedVirtues(dominantVirtue);
  const cleanedVirtues: Record<string, number> = {};

  for (const [virtue, value] of Object.entries(input.virtues)) {
    if (!allowed.has(virtue)) {
      diagnostics.push(`Dropped incompatible virtue "${virtue}" for dominant virtue "${dominantVirtue}".`);
      continue;
    }
    const normalized = Math.max(1, Math.round(Number(value) || 0));
    cleanedVirtues[virtue] = normalized;
    if (!Number.isFinite(value) || value <= 0 || normalized !== value) {
      diagnostics.push(`Adjusted ${virtue} score to ${normalized}.`);
    }
  }

  if (!cleanedVirtues[dominantVirtue]) {
    const maxCurrent = Math.max(0, ...Object.values(cleanedVirtues));
    cleanedVirtues[dominantVirtue] = Math.max(1, maxCurrent + 1);
    diagnostics.push(`Added dominant virtue "${dominantVirtue}" with score ${cleanedVirtues[dominantVirtue]}.`);
  }

  const quest: QuestSeedItem = {
    prompt: input.prompt.trim(),
    duration: input.duration,
    virtues: cleanedVirtues,
  };

  const parseResult = QuestSeedItemSchema.safeParse(quest);
  if (!parseResult.success) {
    diagnostics.push(...parseResult.error.issues.map((issue) => issue.message));
  }

  return { quest, diagnostics };
}

export function validateQuestAgainstDominant(quest: QuestSeedItem, dominantVirtue: VirtueName): string[] {
  const errors: string[] = [];
  const parsed = QuestSeedItemSchema.safeParse(quest);
  if (!parsed.success) {
    errors.push(...parsed.error.issues.map((issue) => issue.message));
  }

  const allowed = getAllowedVirtues(dominantVirtue);
  for (const virtue of Object.keys(quest.virtues)) {
    if (!allowed.has(virtue)) {
      errors.push(`Virtue "${virtue}" is not compatible with dominant virtue "${dominantVirtue}".`);
    }
  }

  if (!(dominantVirtue in quest.virtues)) {
    errors.push(`Dominant virtue "${dominantVirtue}" must be present in virtues.`);
  }

  return errors;
}
