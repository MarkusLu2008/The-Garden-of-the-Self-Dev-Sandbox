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

  {
    prompt: "Spend 15 minutes exploring a new topic or hobby you know little about by reading an article or watching a short video, then jot down three interesting facts you discovered and one question you still have.",
    virtues: { "Curiosity": 5, "Courage": 2 },
    duration: "Medium",
  },
  {
    prompt: "Initiate a short conversation with someone you don’t usually talk to and ask them about something they are passionate about; note what you learned and how it made you feel.",
    virtues: { "Curiosity": 5, "Courage": 3 },
    duration: "Short",
  },
  {
    prompt: "Choose a common object near you and spend 5 minutes observing it carefully, then write down three details you hadn’t noticed before.",
    virtues: { "Curiosity": 5 },
    duration: "Short",
  },
  {
    prompt: "Challenge yourself to try a new taste or food you’ve never had before and reflect on the experience: what surprised you, and how did it feel to step outside your usual preferences?",
    virtues: { "Curiosity": 5, "Courage": 4 },
    duration: "Long",
  },
  {
    prompt: "Watch a documentary or short film about an unfamiliar culture or place and write down three aspects that sparked your curiosity.",
    virtues: { "Curiosity": 10 },
    duration: "Long",
  },
];
