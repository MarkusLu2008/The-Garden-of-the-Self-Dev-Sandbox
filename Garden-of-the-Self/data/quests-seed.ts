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

  {
    prompt: "Choose one area of your life where you often tend to overindulge, such as snacking, screen time, or spending. For the next 30 minutes, engage in a substitute activity that promotes balance, like taking a walk, reading a book, or doing a creative project. Observe how this change affects your mindset and jot down a few thoughts on how moderation could benefit your daily routine.",
    virtues: { "Temperance": 10, "Discipline": 2, "Resilience": 2 },
    duration: "Long",
  },

  {
    prompt: "Prepare and enjoy a balanced meal at home, mindful of portion sizes and nutritional content. Focus on savoring each bite, eating slowly, and stopping when you feel satisfied but not overly full. Reflect on the experience and consider how it affects your mood and energy levels throughout the day.",
    virtues: { "Temperance": 10, "Discipline": 3, "Resilience": 3 },
    duration: "Long",
  },

  {
    prompt: "Set aside 30 minutes to mindfully plan your meals, considering portions, nutritional balance, and how they align with your health goals. As you plan, focus on practicing moderation by allocating reasonable portions, and ensure your plan leaves room for adjustments in case something unexpected occurs during the week.",
    virtues: { "Temperance": 10, "Discipline": 3, "Resilience": 3 },
    duration: "Long",
  },

  {
    prompt: "Today, practice temperance by setting a limit on your social media usage to no more than 30 minutes. Use a timer to track your usage and when it ends, take a moment to reflect on how you feel after disconnecting. Use the extra time to engage in a relaxing or productive activity you often postpone. Can you notice the change in your focus or mood?",
    virtues: { "Temperance": 10, "Discipline": 3, "Resilience": 3 },
    duration: "Long",
  },

  {
    prompt: "Today, practice mindful eating by preparing a meal from scratch using fresh ingredients. Focus on moderating portion sizes and savoring each bite without distractions like phones or TV. Notice how this affects your satisfaction and overall experience.",
    virtues: { "Temperance": 10, "Discipline": 3, "Resilience": 3 },
    duration: "Long",
  },

  {
    prompt: "Research a topic you know little about for five minutes, and write down three new things you learned.",
    virtues: { "Curiosity": 6, "Proper Ambition": 2 },
    duration: "Short",
  },

  {
    prompt: "Spend 5 minutes browsing a random article on a topic you know little about. Note down one intriguing fact or question you want to explore further.",
    virtues: { "Curiosity": 6, "Proper Ambition": 2 },
    duration: "Short",
  },

  {
    prompt: "Find a new word in the dictionary or online, and use it in a sentence related to your career or personal goals.",
    virtues: { "Curiosity": 6, "Proper Ambition": 2 },
    duration: "Short",
  },

  {
    prompt: "Take five minutes to explore something new within your immediate environment—whether it's identifying a plant, finding an interesting fact about an object in your home, or learning a new feature on a device you own. Approach this small discovery with curiosity and reflect just briefly on how it aligns or inspires your bigger goals.",
    virtues: { "Curiosity": 6, "Proper Ambition": 2 },
    duration: "Short",
  },

  {
    prompt: "Spend 5 minutes researching an unfamiliar topic that interests you and write down one question you still have after your brief exploration.",
    virtues: { "Curiosity": 6, "Proper Ambition": 2 },
    duration: "Short",
  },

  {
    prompt: "Identify one small, achievable step you can take today towards a larger personal or professional goal you're working on. Write it down and commit to completing it.",
    virtues: { "Proper Ambition": 5 },
    duration: "Short",
  },

  {
    prompt: "Identify one specific goal you want to achieve by the end of this week. Write down the first three steps you will take towards achieving it.",
    virtues: { "Proper Ambition": 5 },
    duration: "Short",
  },

  {
    prompt: "Identify a single ambitious goal you want to achieve in the next month. Write it down, then list one small action you can take today to move towards this goal.",
    virtues: { "Proper Ambition": 6 },
    duration: "Short",
  },

  {
    prompt: "Spend a few minutes listening to a podcast or watching a short video from someone with a different cultural background or viewpoint than your own. Focus on understanding their perspective without forming judgments.",
    virtues: { "Tolerance": 5, "Respectfulness": 2 },
    duration: "Short",
  },

  {
    prompt: "Engage in a conversation with someone whose views differ from yours. Focus solely on listening and understanding their perspective for five minutes without interrupting or offering your own opinion.",
    virtues: { "Tolerance": 6, "Respectfulness": 2 },
    duration: "Short",
  },

  {
    prompt: "Identify a community service project or charity in your local area and spend time volunteering or contributing in a meaningful way. Focus on helping others without seeking recognition or praise. Involve a friend or colleague to join you in this endeavor, fostering a sense of teamwork.",
    virtues: { "Kindness": 10, "Modesty": 3, "Collaboration": 2 },
    duration: "Long",
  },

  {
    prompt: "Spend time volunteering at a local community center or charity organization for at least 30 minutes today. Focus on helping others without seeking recognition, and collaborate with fellow volunteers to maximize your collective impact.",
    virtues: { "Kindness": 10, "Collaboration": 2, "Modesty": 2 },
    duration: "Long",
  },

  {
    prompt: "Identify a colleague or teammate who often contributes but doesn't seek recognition. Spend 15 to 30 minutes writing a sincere and specific acknowledgment of their efforts, detailing how their work positively impacts the team. Share this acknowledgment with both the individual and the group, if appropriate, to highlight their contributions and foster a supportive environment.",
    virtues: { "Kindness": 10, "Modesty": 3, "Collaboration": 2 },
    duration: "Long",
  },

  {
    prompt: "Take five minutes to plan your meals for the next day, ensuring you have a balanced diet and allocate appropriate portions to avoid overeating. Use this practice to develop a routine that supports your goals.",
    virtues: { "Discipline": 5, "Temperance": 2, "Proper Ambition": 1 },
    duration: "Short",
  },

  {
    prompt: "Set a timer for 5 minutes and organize one small area of your workspace, like a desk drawer or a section of your desktop, focusing on decluttering and prioritizing items that enhance your productivity.",
    virtues: { "Discipline": 5, "Temperance": 2, "Proper Ambition": 1 },
    duration: "Short",
  },

  {
    prompt: "Set a timer for five minutes and organize a cluttered area of your workspace or home. Focus on making it functional, not perfect.",
    virtues: { "Discipline": 5, "Temperance": 2, "Proper Ambition": 1 },
    duration: "Short",
  },

  {
    prompt: "Complete a 5-minute focused stretching routine to prepare for your gym session, maintaining a steady pace without rushing.",
    virtues: { "Discipline": 5, "Patience": 2, "Resilience": 1 },
    duration: "Short",
  },

  {
    prompt: "Spend 5 minutes stretching before your gym workout, focusing on consistent breath control and not rushing through the movements.",
    virtues: { "Discipline": 5, "Patience": 2, "Resilience": 1 },
    duration: "Short",
  },

  {
    prompt: "Seek an opportunity today to praise a colleague, friend, or family member for their achievements or skills. Make sure the praise highlights their strengths without comparing them to yourself.",
    virtues: { "Modesty": 10, "Respectfulness": 3, "Proper Ambition": 2 },
    duration: "Medium",
  },

  {
    prompt: "Reflect on a recent team project or group activity in which you participated. Identify one specific contribution from a teammate that was crucial to the success of the project. Take 15 minutes to write them a short note or email expressing your appreciation for their work, highlighting what you learned from their contribution. Avoid mentioning your own contributions.",
    virtues: { "Modesty": 10, "Respectfulness": 3, "Proper Ambition": 2 },
    duration: "Medium",
  },

  {
    prompt: "Identify one area in your life where you feel successful and write down three humble statements about your achievements that acknowledge the contributions of others or external factors. Share these thoughts with someone you respect and ask for their perspective on your modesty.",
    virtues: { "Modesty": 10, "Respectfulness": 3, "Proper Ambition": 2 },
    duration: "Medium",
  },
];
