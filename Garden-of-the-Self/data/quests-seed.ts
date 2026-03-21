/**
 * Seed data for planned quests (from planning/quest-virtue-combinations.md).
 * Use in DevTools "Seed planned quests" to insert into the DB via insertQuest().
 */

export type QuestSeedItem = {
  prompt: string;
  virtues: Record<string, number>;
  duration: QuestDuration;
};

export type QuestDuration = 'Long' | 'Medium' | 'Short';

export const questDurationOrder: QuestDuration[] = ['Long', 'Medium', 'Short'];

export const questsSeed: QuestSeedItem[] = [
  // Curiosity (dominant)
  {
    prompt:
      'Spend 30 minutes exploring a topic you know almost nothing about and write 5 surprising things you learned.',
    virtues: { Curiosity: 6 },
    duration: 'Long',
  },
];
