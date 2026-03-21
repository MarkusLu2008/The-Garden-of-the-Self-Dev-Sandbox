export type QuestDuration = 'Long' | 'Medium' | 'Short';

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
