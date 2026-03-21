import { z } from 'zod';
import { QuestDurationSchema, QuestSeedItemSchema, type VirtueName, VIRTUE_LIST } from '@/lib/seed-types';

export const ReviewableQuestSchema = QuestSeedItemSchema.extend({
  approved: z.boolean().default(false),
});

export type ReviewableQuest = z.infer<typeof ReviewableQuestSchema>;

export const SeedPayloadSchema = z.object({
  dominantVirtue: z.enum(VIRTUE_LIST),
  quests: z.array(QuestSeedItemSchema).min(1),
});

export type SeedPayload = z.infer<typeof SeedPayloadSchema>;

export const GenerateQuestsApiRequestSchema = z.object({
  dominantVirtue: z.enum(VIRTUE_LIST),
  companionVirtues: z.array(z.enum(VIRTUE_LIST)).default([]),
  duration: QuestDurationSchema,
  count: z.number().int().min(1).max(20),
  model: z.string().optional(),
});

export type GenerateQuestsApiRequest = z.infer<typeof GenerateQuestsApiRequestSchema>;

export type GeneratedQuestResponse = {
  quest: z.infer<typeof QuestSeedItemSchema>;
  diagnostics: string[];
};

export type BatchDiagnostics = {
  warningMessages: string[];
  dominantVirtue: VirtueName;
  allowedCompanions: VirtueName[];
};
