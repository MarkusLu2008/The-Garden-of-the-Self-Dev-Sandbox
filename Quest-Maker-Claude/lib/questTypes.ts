export const QUEST_DURATIONS = ['Long', 'Medium', 'Short'] as const;

export type QuestDuration = (typeof QUEST_DURATIONS)[number];

export type QuestSeedItem = {
  prompt: string;
  virtues: Record<string, number>;
  duration: QuestDuration;
};

export type GenerateSettings = {
  primaryVirtue: string;
  secondaryVirtues: string[];
  duration: QuestDuration;
  count: number;
};
