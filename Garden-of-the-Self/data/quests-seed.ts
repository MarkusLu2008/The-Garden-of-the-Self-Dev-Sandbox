/**
 * Seed data for planned quests (from planning/quest-virtue-combinations.md).
 * Use in DevTools "Seed planned quests" to insert into the DB via insertQuest().
 */

export type QuestSeedItem = {
  prompt: string;
  virtues: Record<string, number>;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
};

export const questsSeed: QuestSeedItem[] = [
  // Curiosity (dominant)
  {
    prompt:
      'Spend 30 minutes exploring a topic you know almost nothing about and write 5 surprising things you learned.',
    virtues: { Curiosity: 6 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'Ask 5 genuine, open-ended questions in conversations today and capture 3 insights that changed how you see something.',
    virtues: { Curiosity: 8, Courage: 2 },
    difficulty: 'Medium',
  },
  {
    prompt:
      'Pick a long-term goal and research 3 unconventional ways others have pursued it, summarizing pros and cons of each path.',
    virtues: { Curiosity: 12, 'Proper Ambition': 4 },
    difficulty: 'Hard',
  },
  // Courage (dominant)
  {
    prompt:
      'Do one thing today that scares you slightly but is clearly safe and meaningful (e.g., share an honest opinion, start a hard task) and journal the outcome.',
    virtues: { Courage: 5 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'Initiate a vulnerable conversation you have been avoiding and stay present for at least 10 minutes, even if it feels uncomfortable.',
    virtues: { Courage: 14, Curiosity: 3 },
    difficulty: 'Hard',
  },
  {
    prompt:
      'Take a bold step toward a goal (send an application, publish something, ask for feedback) and record what you learned regardless of the result.',
    virtues: { Courage: 9, 'Proper Ambition': 3 },
    difficulty: 'Medium',
  },
  // Proper Ambition (dominant)
  {
    prompt:
      'Define a 6–12 month goal and break it into weekly checkpoints, making sure each step feels demanding but realistic.',
    virtues: { 'Proper Ambition': 10 },
    difficulty: 'Medium',
  },
  {
    prompt:
      'Share your main ambition with someone you trust and invite them to challenge it, then revise your goal to keep it both bold and grounded.',
    virtues: { 'Proper Ambition': 13, Modesty: 5 },
    difficulty: 'Hard',
  },
  {
    prompt:
      'Design a 7-day routine that moves you measurably closer to your ambition and follow it for 3 days as an experiment.',
    virtues: { 'Proper Ambition': 12, Discipline: 3, Kindness: 1 },
    difficulty: 'Hard',
  },
  // Kindness (dominant)
  {
    prompt:
      'Perform 3 small, invisible acts of kindness today that no one will trace back to you.',
    virtues: { Kindness: 4 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'Identify someone who seems stressed or isolated and offer 15 minutes of undistracted, nonjudgmental listening.',
    virtues: { Kindness: 9, Empathy: 4 },
    difficulty: 'Medium',
  },
  {
    prompt:
      "Support someone else's goal (feedback, encouragement, a practical favor) in a way that costs you some effort but feels genuinely generous.",
    virtues: { Kindness: 11, Collaboration: 2, 'Proper Ambition': 2 },
    difficulty: 'Hard',
  },
  // Modesty (dominant)
  {
    prompt:
      "In your next group setting, deliberately speak once and then spend the rest of the time amplifying others' ideas instead of your own.",
    virtues: { Modesty: 8, Respectfulness: 2 },
    difficulty: 'Medium',
  },
  {
    prompt:
      'List 5 strengths and 5 weaknesses honestly, then share one weakness with someone you trust without defending or justifying it.',
    virtues: { Modesty: 12 },
    difficulty: 'Hard',
  },
  {
    prompt:
      'When you receive praise today, accept it briefly and then highlight contributions from at least one other person.',
    virtues: { Modesty: 7, Kindness: 1 },
    difficulty: 'Easy',
  },
  // Discipline (dominant)
  {
    prompt:
      'Choose one small habit (e.g., 10 minutes of reading, a short walk, tidying a space) and execute it at the same time 3 days in a row.',
    virtues: { Discipline: 7 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'Block 60–90 minutes for a focused work session, remove distractions, and stick with a single task until the timer ends.',
    virtues: { Discipline: 10, Patience: 3 },
    difficulty: 'Medium',
  },
  {
    prompt:
      'Identify one overindulgent behavior (scrolling, snacking, etc.) and set a clear limit for today, keeping a simple log of urges and choices.',
    virtues: { Discipline: 13, Temperance: 2, Resilience: 1 },
    difficulty: 'Hard',
  },
  // Resilience (dominant)
  {
    prompt:
      'Revisit a recent setback and write a short story from the perspective of "future you" who has grown because of it.',
    virtues: { Resilience: 6 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'Return to a project you previously abandoned and spend at least 25 minutes moving it one clear step forward.',
    virtues: { Resilience: 14, Discipline: 4 },
    difficulty: 'Hard',
  },
  {
    prompt:
      'When something goes wrong today, consciously name one thing you still control and take a small, constructive action based on it.',
    virtues: { Resilience: 9, Temperance: 2 },
    difficulty: 'Medium',
  },
  // Patience (dominant)
  {
    prompt:
      'Choose one everyday delay (a line, traffic, loading screen) and use it as a cue to practice 10 slow breaths instead of reaching for your phone.',
    virtues: { Patience: 5 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'Work on a task that normally frustrates you for 20 uninterrupted minutes, focusing on steady progress rather than speed.',
    virtues: { Patience: 8, Discipline: 3 },
    difficulty: 'Medium',
  },
  {
    prompt:
      'In one conversation today, wait 3 full seconds after someone finishes speaking before you respond, and notice what changes.',
    virtues: { Patience: 12, Tolerance: 2, Kindness: 1 },
    difficulty: 'Hard',
  },
  // Temperance (dominant)
  {
    prompt:
      'Pick one area of excess (food, media, spending, etc.) and intentionally reduce it by 25% for today, reflecting on how it feels.',
    virtues: { Temperance: 6 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'Plan your next 24 hours with simple boundaries around work, rest, and leisure, and follow them as closely as you can.',
    virtues: { Temperance: 11, Discipline: 3 },
    difficulty: 'Medium',
  },
  {
    prompt:
      'Before accepting or declining any invitation today, pause and ask whether it supports your longer-term balance and priorities.',
    virtues: { Temperance: 13, Resilience: 2, Tolerance: 2 },
    difficulty: 'Hard',
  },
  // Empathy (dominant)
  {
    prompt:
      'Choose one person and write a short paragraph imagining their current worries, hopes, and pressures from their point of view.',
    virtues: { Empathy: 7 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'In your next disagreement, restate the other person\'s view in your own words and ask if they feel accurately understood before replying.',
    virtues: { Empathy: 13, Tolerance: 3 },
    difficulty: 'Hard',
  },
  {
    prompt:
      "Reach out to someone you haven't spoken to in a while and ask 3 questions about what life has really been like for them recently.",
    virtues: { Empathy: 10, Collaboration: 2, Kindness: 1 },
    difficulty: 'Medium',
  },
  // Collaboration (dominant)
  {
    prompt:
      'Invite someone to co-create or co-decide something with you (a plan, design, schedule) and genuinely incorporate their ideas.',
    virtues: { Collaboration: 9 },
    difficulty: 'Medium',
  },
  {
    prompt:
      'During a group task, explicitly clarify roles and shared goals, and check in once to see how everyone is feeling about the process.',
    virtues: { Collaboration: 6, Empathy: 2 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'Ask a teammate or friend how you could be a better collaborator for them this week and act on one concrete suggestion.',
    virtues: { Collaboration: 12, Kindness: 4 },
    difficulty: 'Hard',
  },
  // Tolerance (dominant)
  {
    prompt:
      'Read or watch a thoughtful piece from a perspective you typically disagree with and list 3 points you can still respect or understand.',
    virtues: { Tolerance: 6 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'When someone does something that annoys you today, silently generate one generous explanation before reacting.',
    virtues: { Tolerance: 9, Patience: 2 },
    difficulty: 'Medium',
  },
  {
    prompt:
      'Have a calm conversation with someone who differs from you on a value or preference, focusing only on understanding, not persuading.',
    virtues: { Tolerance: 14, Temperance: 2, Respectfulness: 2 },
    difficulty: 'Hard',
  },
  // Respectfulness (dominant)
  {
    prompt:
      'Choose a shared physical or digital space you use with others and spend 15 minutes improving it in a way that honors everyone\'s needs.',
    virtues: { Respectfulness: 5 },
    difficulty: 'Easy',
  },
  {
    prompt:
      'In your next conversation, avoid interrupting entirely and instead signal that you value the other person\'s time and attention.',
    virtues: { Respectfulness: 8, Modesty: 3 },
    difficulty: 'Medium',
  },
  {
    prompt:
      'Identify one rule, norm, or tradition you usually ignore, and consciously follow it today as a way of honoring the people it benefits.',
    virtues: { Respectfulness: 13, Tolerance: 3 },
    difficulty: 'Hard',
  },
];
