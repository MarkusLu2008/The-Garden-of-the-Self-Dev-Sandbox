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
  // Imported from quests.jsonl (validated; rewards clamped to 1..10)
  {
    prompt:
      "Speak with someone you admire about a challenge they've overcome. Ask them three specific questions about their experience and take one actionable insight to apply in your life.",
    virtues: { Courage: 6, Curiosity: 2, "Proper Ambition": 2 },
    duration: "Long",
  },
  {
    prompt:
      "Strike up a conversation with a stranger today, either online or in person, and ask them about their personal journey or a unique experience they've had. Reflect on what you learn.",
    virtues: { Courage: 5, Curiosity: 2, "Proper Ambition": 1 },
    duration: "Long",
  },
  {
    prompt:
      "Send a message to someone you admire but have never spoken to, expressing your appreciation for their work or impact.",
    virtues: { Courage: 6, Curiosity: 1, "Proper Ambition": 10 },
    duration: "Short",
  },
  {
    prompt:
      "Introduce yourself to someone new and ask them about their favorite book or film. Share your own as well.",
    virtues: { Courage: 5, Curiosity: 3, "Proper Ambition": 1 },
    duration: "Medium",
  },
  {
    prompt:
      "Approach a colleague or classmate you find intimidating and ask them about a project or topic they're passionate about.",
    virtues: { Courage: 5, Curiosity: 2, "Proper Ambition": 1 },
    duration: "Long",
  },
  {
    prompt:
      "Identify a long-term goal you've been considering but have not yet acted upon. Break it down into at least three actionable steps you can start in the next month. Complete the first step today, no matter how small, to initiate momentum towards your goal.",
    virtues: { "Proper Ambition": 10 },
    duration: "Medium",
  },
  {
    prompt:
      "Identify a dream or goal you've been postponing. Break it down into three actionable steps you can start implementing tomorrow. Share this plan with a friend or mentor for feedback.",
    virtues: { "Proper Ambition": 10 },
    duration: "Medium",
  },
  {
    prompt:
      "Identify a skill or knowledge area you've been curious about but haven't pursued yet. Spend an hour today researching and outlining a small project or goal you can realistically achieve within the next month to begin developing this interest.",
    virtues: { "Proper Ambition": 10 },
    duration: "Medium",
  },
  {
    prompt:
      "Set a clear, realistic goal you want to achieve within the next six months that aligns with your long-term aspirations. Break it down into manageable steps, and identify the first three actions you can take this week to begin moving toward this goal.",
    virtues: { "Proper Ambition": 10 },
    duration: "Medium",
  },
  {
    prompt:
      "Set a timer for 5 minutes and organize a small area of your living or work space. Focus on clearing clutter and putting items back in their designated places.",
    virtues: { Discipline: 5, Temperance: 2 },
    duration: "Short",
  },
  {
    prompt:
      "Choose one task on your to-do list and work on it (not complete unless you want to) without interruptions. Set a timer for 5 minutes, focus solely on this task, and experience the satisfaction of progress.",
    virtues: { Discipline: 5, Temperance: 2 },
    duration: "Short",
  },
  {
    prompt:
      "Set a timer for 5 minutes and organize a small area of your space, like a drawer or a shelf. Focus on staying disciplined and maintaining balance by not over-organizing or under-organizing. Make sure you move on.",
    virtues: { Discipline: 5, Temperance: 2 },
    duration: "Short",
  },
  {
    prompt:
      "Choose a task you've been procrastinating on and spend 15 minutes today working on it without distractions. Focus solely on progressing with the task, whether it is organizing a cluttered area, responding to pending emails, or working on a personal project.",
    virtues: { Discipline: 10, Temperance: 3 },
    duration: "Medium",
  },
  {
    prompt:
      "Identify a daily habit you want to improve. Set a timer for 10 minutes and work on enhancing consistency in that habit today. Focus on maintaining balance to prevent burnout.",
    virtues: { Discipline: 10, Temperance: 3 },
    duration: "Medium",
  },
  {
    prompt:
      "Plan your meals for the next day, ensuring you include a balance of healthy foods and stick to the schedule you create. Spend 10-15 minutes preparing a detailed plan that includes breakfast, lunch, dinner, and any snacks, focusing on portion control and nutrition.",
    virtues: { Discipline: 10, Temperance: 3 },
    duration: "Medium",
  },
  {
    prompt:
      "Identify someone in your community or network who might need assistance or a friendly gesture. Spend at least 20-30 minutes offering them help, whether it's running an errand, providing a listening ear, or another act of kindness that feels meaningful to them.",
    virtues: { Kindness: 10 },
    duration: "Long",
  },
  {
    prompt:
      "Reach out to a local charity or community organization that you care about and offer to volunteer your time for a specific initiative or event this week. Spend today arranging the details and committing to the time you will dedicate.",
    virtues: { Kindness: 10 },
    duration: "Long",
  },
  {
    prompt:
      "Choose an organization or cause that's meaningful to you and spend at least 30 minutes researching ways to contribute. Offer your time to volunteer for a future event, sign up to donate regularly, or share their work with your network to raise awareness and support.",
    virtues: { Kindness: 10 },
    duration: "Long",
  },
  {
    prompt:
      "Call a friend or family member you haven't spoken to in a while and ask how they are doing. Offer your ear and support if they need it.",
    virtues: { Kindness: 10 },
    duration: "Medium",
  },
  {
    prompt:
      "Reach out to someone you know who might be having a tough time and offer your support. This could be a simple phone call, a thoughtful message, or a brief visit. Show genuine care by asking how you can help.",
    virtues: { Kindness: 10 },
    duration: "Medium",
  },
  {
    prompt:
      "Surprise a colleague, friend, or family member by performing a small, unexpected act of kindness today. It could be buying them a coffee, helping them with a task, or giving them a kind note.",
    virtues: { Kindness: 10 },
    duration: "Short",
  },
  {
    prompt:
      "Send a thoughtful message to someone who might need a little encouragement or support today, whether it's a friend, family member, or colleague.",
    virtues: { Kindness: 5 },
    duration: "Short",
  },
  {
    prompt: "Leave an encouraging note for a family member or colleague to brighten their day.",
    virtues: { Kindness: 5 },
    duration: "Short",
  },
  {
    prompt:
      "Send a thoughtful text or message to someone you appreciate, expressing gratitude or offering support.",
    virtues: { Kindness: 5 },
    duration: "Short",
  },
];
