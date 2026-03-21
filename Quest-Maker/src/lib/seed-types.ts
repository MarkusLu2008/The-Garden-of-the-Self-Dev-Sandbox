import { z } from 'zod';

export const VIRTUE_LIST = [
  'Courage',
  'Temperance',
  'Patience',
  'Kindness',
  'Proper Ambition',
  'Modesty',
  'Empathy',
  'Resilience',
  'Curiosity',
  'Respectfulness',
  'Tolerance',
  'Collaboration',
  'Discipline',
] as const;

export type VirtueName = (typeof VIRTUE_LIST)[number];
export const VIRTUE_SET = new Set<string>(VIRTUE_LIST);

export const QUEST_DURATIONS = ['Long', 'Medium', 'Short'] as const;
export type QuestDuration = (typeof QUEST_DURATIONS)[number];

export type QuestSeedItem = {
  prompt: string;
  virtues: Record<string, number>;
  duration: QuestDuration;
};

export const QuestDurationSchema = z.enum(QUEST_DURATIONS);

export const QuestSeedItemSchema = z
  .object({
    prompt: z.string().trim().min(12, 'Prompt must be at least 12 characters'),
    virtues: z.record(z.string(), z.number()),
    duration: QuestDurationSchema,
  })
  .superRefine((value, ctx) => {
    const virtueEntries = Object.entries(value.virtues);
    if (virtueEntries.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['virtues'],
        message: 'At least one virtue is required',
      });
      return;
    }

    for (const [virtueName, rawValue] of virtueEntries) {
      if (!VIRTUE_SET.has(virtueName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['virtues', virtueName],
          message: `${virtueName} is not a known virtue`,
        });
      }
      if (!Number.isFinite(rawValue) || rawValue <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['virtues', virtueName],
          message: `Virtue score for ${virtueName} must be greater than 0`,
        });
      }
    }
  });

export const GenerateQuestRequestSchema = z.object({
  dominantVirtue: z.enum(VIRTUE_LIST),
  companionVirtues: z.array(z.enum(VIRTUE_LIST)).default([]),
  duration: QuestDurationSchema,
  count: z.number().int().min(1).max(20).default(5),
  model: z.string().optional(),
});

export type GenerateQuestRequest = z.infer<typeof GenerateQuestRequestSchema>;
