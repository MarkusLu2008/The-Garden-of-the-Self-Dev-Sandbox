import { QUEST_DURATIONS, type QuestDuration, type QuestSeedItem } from '@/lib/questTypes';
import { VIRTUES } from '@/lib/virtues';

export type ValidationIssue = {
  field: string;
  message: string;
};

export type ValidationResult =
  | {
      ok: true;
      value: QuestSeedItem;
    }
  | {
      ok: false;
      issues: ValidationIssue[];
    };

const QUEST_DURATION_SET = new Set<string>(QUEST_DURATIONS);
const VIRTUE_SET = new Set<string>(VIRTUES);
const MIN_REWARD = 1;
const MAX_REWARD = 10;

function clampReward(value: number): number {
  return Math.min(MAX_REWARD, Math.max(MIN_REWARD, Math.round(value)));
}

export function validateAndSanitizeQuest(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, issues: [{ field: 'quest', message: 'Payload must be an object.' }] };
  }

  const quest = input as Partial<QuestSeedItem>;
  const issues: ValidationIssue[] = [];

  const prompt = typeof quest.prompt === 'string' ? quest.prompt.trim() : '';
  if (!prompt) {
    issues.push({ field: 'prompt', message: 'Prompt is required.' });
  }

  const duration = quest.duration;
  if (typeof duration !== 'string' || !QUEST_DURATION_SET.has(duration)) {
    issues.push({ field: 'duration', message: 'Duration must be one of: Long, Medium, Short.' });
  }

  const virtuesInput = quest.virtues;
  if (!virtuesInput || typeof virtuesInput !== 'object' || Array.isArray(virtuesInput)) {
    issues.push({ field: 'virtues', message: 'Virtues must be a non-empty object.' });
    return { ok: false, issues };
  }

  const entries = Object.entries(virtuesInput);
  if (entries.length === 0) {
    issues.push({ field: 'virtues', message: 'At least one virtue is required.' });
  }

  const sanitizedVirtues: Record<string, number> = {};
  for (const [virtueName, rawValue] of entries) {
    if (!VIRTUE_SET.has(virtueName)) {
      issues.push({
        field: `virtues.${virtueName}`,
        message: `Unknown virtue "${virtueName}".`,
      });
      continue;
    }

    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
      issues.push({
        field: `virtues.${virtueName}`,
        message: 'Value must be a finite number.',
      });
      continue;
    }

    sanitizedVirtues[virtueName] = clampReward(rawValue);
  }

  if (Object.keys(sanitizedVirtues).length === 0) {
    issues.push({ field: 'virtues', message: 'At least one valid virtue value is required.' });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      prompt,
      duration: duration as QuestDuration,
      virtues: sanitizedVirtues,
    },
  };
}
