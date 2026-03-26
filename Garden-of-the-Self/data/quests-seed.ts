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

  {
    prompt: "Set a timer for 5 minutes and write down three achievable goals you want to pursue today. Include one goal that involves helping someone else and one where you learn something new.",
    virtues: { "Proper Ambition": 5, "Curiosity": 2, "Kindness": 2 },
    duration: "Short",
  },

  {
    prompt: "Set a small, achievable goal for your day that aligns with your long-term ambitions. Then, take a moment to ask a colleague or friend about a recent challenge they faced and offer a supportive word or gesture.",
    virtues: { "Proper Ambition": 5, "Kindness": 2, "Curiosity": 1 },
    duration: "Short",
  },

  {
    prompt: "Pick up a book you've never read before, open it to a random page, and read one paragraph. What new idea or concept did it bring up?",
    virtues: { "Curiosity": 5, "Courage": 1, "Proper Ambition": 1 },
    duration: "Short",
  },

  {
    prompt: "Spend five minutes exploring a topic you've always been curious about but never took the time to learn. Use a search engine to find at least one new, fascinating fact related to this topic.",
    virtues: { "Curiosity": 5, "Courage": 2, "Proper Ambition": 1 },
    duration: "Short",
  },

  {
    prompt: "Visit a local library or bookstore, pick up a book from a section you've never explored, and spend at least 10 minutes browsing through its content. Take note of any new concepts or ideas you encounter.",
    virtues: { "Curiosity": 10 },
    duration: "Medium",
  },

  {
    prompt: "Research an unfamiliar topic you've always been curious about. Spend 10 to 15 minutes finding interesting facts or insights. Capture your findings in a few bullet points.",
    virtues: { "Curiosity": 10 },
    duration: "Medium",
  },

  {
    prompt: "Visit a local park or nearby natural area and identify three different species of plants or trees. Use a plant identification app or guidebook to learn something new about each one.",
    virtues: { "Curiosity": 10 },
    duration: "Medium",
  },

  {
    prompt: "Research a topic you've always been curious about but never took the time to dive into. Spend 10-15 minutes learning about it online or through a book. Write down three fascinating facts you discover.",
    virtues: { "Curiosity": 10, "Proper Ambition": 3 },
    duration: "Medium",
  },

  {
    prompt: "Explore a topic you've always been curious about but never took the time to research. Spend 15 minutes reading or watching a documentary about it, and jot down three new insights you gained. Consider if this new knowledge could inspire any personal ambitions or if it challenges you to step out of your comfort zone.",
    virtues: { "Curiosity": 10, "Courage": 3, "Proper Ambition": 2 },
    duration: "Medium",
  },

  {
    prompt: "Research a topic you've never explored before. Select something you've always been vaguely interested in but never took the time to explore. Spend 10-15 minutes gathering interesting facts and insights, then share what you found with a friend or family member.",
    virtues: { "Curiosity": 10, "Courage": 2, "Proper Ambition": 2 },
    duration: "Medium",
  },

  {
    prompt: "Take 15 minutes to explore a topic you've never delved into before. Begin by choosing a new subject that piques your curiosity. Conduct a brief internet search or read a short article on the subject, noting down three interesting facts you didn't know. Challenge yourself to ask one bold question about the subject that would push your understanding further.",
    virtues: { "Curiosity": 10, "Courage": 2, "Proper Ambition": 2 },
    duration: "Medium",
  },

  {
    prompt: "Deep dive a topic you've always been curious about but have never taken the time to explore. Dedicate time to find credible sources, and summarize your findings. Consider how this newfound knowledge could positively influence your current ambitions or goals.",
    virtues: { "Curiosity": 10, "Proper Ambition": 3 },
    duration: "Long",
  },

  {
    prompt: "Identify a topic or field you've always been curious about but never had the chance to explore. Spend up to 30 minutes researching this topic online or through a book. Note down at least three new things you learn and reflect on how this knowledge might inspire or influence your personal goals.",
    virtues: { "Curiosity": 10, "Proper Ambition": 3 },
    duration: "Long",
  },

  {
    prompt: "Visit a local museum, gallery, or cultural site that interests you. Spend at least 20 minutes exploring an exhibit or artwork you've never engaged with before. Push yourself to ask a guide or fellow visitor an open-ended question about what you're observing, and aim to learn something new from the conversation.",
    virtues: { "Curiosity": 10, "Courage": 3, "Proper Ambition": 2 },
    duration: "Long",
  },

  {
    prompt: "Visit a local cultural or historical site in your area that you've never been to before. Engage with at least three new facts or stories about the place. Reflect on how these new insights could inspire a personal project or goal.",
    virtues: { "Curiosity": 10, "Courage": 3, "Proper Ambition": 2 },
    duration: "Long",
  },

  {
    prompt: "Approach someone you've been meaning to connect with, whether they're a colleague, neighbor, or acquaintance, and start a genuine conversation. Ask them a meaningful question about their interests or share an interesting personal story to break the ice.",
    virtues: { "Courage": 10 },
    duration: "Medium",
  },

  {
    prompt: "Approach a colleague or neighbor whom you don't know very well. Start a conversation by asking them about their interests or recent experiences. Aim to learn something new about them and briefly share something about yourself in return.",
    virtues: { "Courage": 10 },
    duration: "Medium",
  },

  {
    prompt: "Identify a task or conversation you've been avoiding out of fear or uncertainty. Take a bold step today: schedule or initiate this task or conversation within the next few hours. Reflect on how taking this step made you feel braver.",
    virtues: { "Courage": 10 },
    duration: "Medium",
  },

  {
    prompt: "Identify a long-term goal or dream that excites you. Break it down into smaller, achievable milestones and create a step-by-step plan on how you'll accomplish the first milestone. As you craft your plan, consider realistic timelines and acknowledge potential obstacles, while also reflecting on the strengths and contributions you bring to this goal without seeking external validation.",
    virtues: { "Proper Ambition": 10, "Modesty": 3 },
    duration: "Long",
  },

  {
    prompt: "Identify a personal goal that aligns with your long-term ambitions, and create a detailed action plan for the next month. Outline clear, achievable steps that you can take each week to progress towards this goal. Ensure your plan reflects both your current capabilities and a modest view of your resources, avoiding overcommitment.",
    virtues: { "Proper Ambition": 10, "Modesty": 2 },
    duration: "Long",
  },

  {
    prompt: "Identify a small, realistic goal to achieve today, such as reading a few pages of a book or organizing a small area in your home. While setting this goal, ensure it aligns with your broader ambitions but remains modest in scope. Reflect briefly on one new thing you learn during this activity.",
    virtues: { "Proper Ambition": 5, "Curiosity": 2, "Modesty": 2 },
    duration: "Short",
  },

  {
    prompt: "Spend five minutes researching a personal goal you have. Note down one realistic step you can take towards it today, while reflecting on the balance between ambition and humility.",
    virtues: { "Proper Ambition": 6, "Curiosity": 2, "Modesty": 2 },
    duration: "Short",
  },

  {
    prompt: "Set one achievable goal for today that stretches your current abilities slightly, write it down, and take a small action towards it. Ensure the goal does not require external validation or attention.",
    virtues: { "Proper Ambition": 5, "Modesty": 2, "Curiosity": 1 },
    duration: "Short",
  },

  {
    prompt: "Identify one ambitious goal you want to achieve in the next year and write it down. List one small, actionable step you can take today to move closer to this goal.",
    virtues: { "Proper Ambition": 5, "Discipline": 2 },
    duration: "Short",
  },

  {
    prompt: "Write a single, achievable goal for today that aligns with your long-term aspirations and plan one specific action you will take to move towards it.",
    virtues: { "Proper Ambition": 6, "Discipline": 2 },
    duration: "Short",
  },

  {
    prompt: "Set a timer for 5 minutes and brainstorm a list of five achievable goals you want to accomplish this month. Prioritize them from most to least important and consider how each aligns with your long-term aspirations.",
    virtues: { "Proper Ambition": 6, "Discipline": 2 },
    duration: "Short",
  },

  {
    prompt: "Identify a personal or professional goal you've been hesitant to pursue due to uncertainty or fear. Dedicate at least 20 minutes today to create a detailed action plan for achieving this goal. Break it down into manageable steps and schedule the first step within the next week. Reach out to a trusted friend or mentor to share your plan and ask for their support or feedback.",
    virtues: { "Proper Ambition": 10, "Courage": 3, "Kindness": 2 },
    duration: "Long",
  },

  {
    prompt: "Identify a skill or area where you can grow and aim high. Reach out to someone you admire in that field and ask for their guidance or advice. Use this opportunity to not only learn from them but to also offer a kind gesture or assist them in a meaningful way.",
    virtues: { "Proper Ambition": 10, "Courage": 3, "Kindness": 2 },
    duration: "Long",
  },

  {
    prompt: "Set a personal goal that aligns with your long-term ambitions. Spend 10-15 minutes breaking it down into actionable steps, ensuring each step is both challenging and achievable. Keep your plan modest by acknowledging your current limits and make a commitment to follow through consistently.",
    virtues: { "Proper Ambition": 10, "Discipline": 3, "Modesty": 2 },
    duration: "Medium",
  },

  {
    prompt: "Set a meaningful goal for the next month in an area of your life where you aspire to grow. Research and identify three resources (such as books, articles, or videos) that can help you achieve this goal. Then, define three concrete steps you can take over the next week to get started. Make sure your goal is ambitious yet realistic, and be prepared to adapt your plan as you learn more.",
    virtues: { "Proper Ambition": 10, "Curiosity": 3, "Discipline": 2 },
    duration: "Long",
  },

  {
    prompt: "Approach someone you've been hesitant to talk to and initiate a conversation, even if it's just to say hello or introduce yourself.",
    virtues: { "Courage": 6, "Proper Ambition": 2 },
    duration: "Short",
  },

  {
    prompt: "Introduce yourself to someone new today, either in person or online, and learn one interesting fact about them.",
    virtues: { "Courage": 6, "Proper Ambition": 2 },
    duration: "Short",
  },

  {
    prompt: "Introduce yourself to a new colleague or neighbor and start a brief conversation.",
    virtues: { "Courage": 6, "Proper Ambition": 2 },
    duration: "Short",
  },

  {
    prompt: "Identify one long-term goal that excites you and write down one immediate, small action you can take today to move closer to achieving it.",
    virtues: { "Proper Ambition": 6, "Courage": 2 },
    duration: "Short",
  },

  {
    prompt: "Identify one ambition you've been hesitant to pursue. Take one small step toward it today by researching a relevant resource or reaching out to someone who can provide insight.",
    virtues: { "Proper Ambition": 5, "Courage": 2 },
    duration: "Short",
  },

  {
    prompt: "Identify a small fear or hesitation you have about trying something new today, then take a courageous step to face it. Whether it's speaking up in a meeting, introducing yourself to someone, or trying a new hobby, take that bold step. Reflect briefly on any insights or discoveries along the way.",
    virtues: { "Courage": 10, "Curiosity": 2 },
    duration: "Medium",
  },

  {
    prompt: "Engage in a conversation with someone you admire but have never spoken to before. Ask them at least three open-ended questions about their life or work, and listen actively to their responses.",
    virtues: { "Courage": 10, "Curiosity": 3 },
    duration: "Medium",
  },

  {
    prompt: "Set a personal goal that you want to achieve within the next three months. Clearly define what success looks like and list three actionable steps you can take to begin working towards it. Ensure that this goal is challenging yet realistic, and consider how achieving it impacts not just your personal growth but also those around you, reflecting modesty in its scope.",
    virtues: { "Proper Ambition": 10, "Modesty": 3 },
    duration: "Medium",
  },

  {
    prompt: "Identify a goal you've been hesitant to pursue because it feels too ambitious. Break it down into smaller, achievable steps and list the first step you can realistically take today. Focus on how you can approach this goal modestly, without needing recognition from others.",
    virtues: { "Proper Ambition": 10, "Modesty": 3 },
    duration: "Medium",
  },

  {
    prompt: "Create a detailed action plan for achieving a specific long-term goal you have. Break it down into smaller, actionable steps with deadlines for each step. Review your plan at the end of the day and adjust timelines if necessary.",
    virtues: { "Proper Ambition": 10, "Discipline": 3 },
    duration: "Long",
  },

  {
    prompt: "Set a challenging yet achievable goal for yourself in an area of personal or professional development. Break this goal down into three actionable steps and commit to completing the first step today. Allocate time at the end of the day to reflect on your progress and adjust your plan if necessary for future steps.",
    virtues: { "Proper Ambition": 10, "Discipline": 4 },
    duration: "Long",
  },
];
