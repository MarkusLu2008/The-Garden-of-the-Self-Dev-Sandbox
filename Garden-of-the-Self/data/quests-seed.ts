/**
 * Seed data for quests — Garden of the Self.
 *
 * Reward tiers by duration (rough proportions):
 *   Short  → primary 2, secondary 1
 *   Medium → primary 3, secondary 2
 *   Long   → primary 5, secondary 3 (+ tertiary 2 for hardest quests)
 *
 * Every quest has at least 2 virtues. Harder social/material quests
 * skew Long. Solo inward quests skew Short.
 */

export type QuestSeedItem = {
  prompt: string;
  virtues: Record<string, number>;
  duration: QuestDuration;
};

export type QuestDuration = 'Long' | 'Medium' | 'Short';

export const questDurationOrder: QuestDuration[] = ['Long', 'Medium', 'Short'];

export const questsSeed: QuestSeedItem[] = [
  // ─────────────────────────────────────────────────────────────────
  // LONG (20–30+ min; harder, more reward)
  // ─────────────────────────────────────────────────────────────────

  // Curiosity — Long
  {
    prompt:
      'Visit a local museum, gallery, or cultural site that interests you. Spend at least 20 minutes exploring an exhibit or artwork you\'ve never engaged with before. Push yourself to ask a guide or fellow visitor an open-ended question about what you\'re observing, and aim to learn something new from the conversation.',
    virtues: { Curiosity: 5, Courage: 3 },
    duration: 'Long',
  },
  {
    prompt:
      'Deep dive into a topic you\'ve always been curious about but have never taken the time to explore. Dedicate real time to finding credible sources, and summarize your findings in your own words. Consider how this newfound knowledge could influence your current ambitions or goals.',
    virtues: { Curiosity: 5, 'Proper Ambition': 3 },
    duration: 'Long',
  },
  {
    prompt:
      'Visit a local cultural or historical site you\'ve never been to before. Engage with at least three new facts or stories about the place. Reflect on how these insights could inspire a personal project or goal.',
    virtues: { Curiosity: 5, Courage: 3 },
    duration: 'Long',
  },
  {
    prompt:
      'Identify a topic or field you\'ve always been curious about but never had the chance to explore. Spend up to 30 minutes researching this topic online or through a book. Note down at least three new things you learn and reflect on how this knowledge might inspire or influence your personal goals.',
    virtues: { Curiosity: 5, 'Proper Ambition': 3 },
    duration: 'Long',
  },

  // Courage — Long (social, harder)
  {
    prompt:
      'Speak with someone you admire about a challenge they\'ve overcome. Ask them three specific questions about their experience and take one actionable insight to apply in your life.',
    virtues: { Courage: 5, Curiosity: 3, 'Proper Ambition': 2 },
    duration: 'Long',
  },
  {
    prompt:
      'Strike up a conversation with a stranger today — online or in person — and ask them about their personal journey or a unique experience they\'ve had. Reflect on what you learn.',
    virtues: { Courage: 5, Curiosity: 3 },
    duration: 'Long',
  },
  {
    prompt:
      'Spend at least 20 minutes volunteering at a local community center or charity organization. Focus on helping others without seeking recognition, and collaborate with fellow volunteers to maximize your collective impact.',
    virtues: { Kindness: 5, Collaboration: 3, Modesty: 2 },
    duration: 'Long',
  },
  {
    prompt:
      'Identify a community service project or charity in your local area and spend real time contributing in a meaningful way. Focus on helping others without seeking recognition or praise. Involve a friend or colleague to join you in this endeavor.',
    virtues: { Kindness: 5, Collaboration: 3, Modesty: 2 },
    duration: 'Long',
  },

  // Proper Ambition — Long
  {
    prompt:
      'Identify a personal goal that aligns with your long-term ambitions, and create a detailed action plan for the next month. Outline clear, achievable steps that you can take each week to progress towards this goal. Ensure your plan reflects both your current capabilities and a modest view of your resources.',
    virtues: { 'Proper Ambition': 5, Modesty: 3 },
    duration: 'Long',
  },
  {
    prompt:
      'Identify a goal you\'ve been hesitant to pursue because it feels too ambitious. Break it down into smaller, achievable steps and write down the first step you can realistically take today. Focus on approaching this goal modestly, without needing recognition from others.',
    virtues: { 'Proper Ambition': 5, Modesty: 3 },
    duration: 'Long',
  },
  {
    prompt:
      'Create a detailed action plan for achieving a specific long-term goal you have. Break it down into smaller, actionable steps with deadlines for each step. Review your plan at the end of the day and adjust timelines if necessary.',
    virtues: { 'Proper Ambition': 5, Discipline: 3 },
    duration: 'Long',
  },
  {
    prompt:
      'Set a challenging yet achievable goal for yourself in an area of personal or professional development. Break this goal down into three actionable steps and commit to completing the first step today. Allocate time at the end of the day to reflect on your progress.',
    virtues: { 'Proper Ambition': 5, Discipline: 3 },
    duration: 'Long',
  },
  {
    prompt:
      'Identify a personal or professional goal you\'ve been hesitant to pursue due to uncertainty or fear. Dedicate at least 20 minutes today to create a detailed action plan for achieving this goal. Break it down into manageable steps and schedule the first step within the next week.',
    virtues: { 'Proper Ambition': 5, Courage: 3, Kindness: 2 },
    duration: 'Long',
  },

  // Discipline — Long
  {
    prompt:
      'Choose a skill you want to develop and spend at least 20 minutes practicing it with full focus — not to master it, just to show up for it. Build something small, write something, draw something, or work through exercises. Begin before you feel ready.',
    virtues: { Discipline: 5, Resilience: 3 },
    duration: 'Long',
  },

  // Kindness — Long
  {
    prompt:
      'Identify someone in your community or network who might need assistance or a friendly gesture. Spend at least 20–30 minutes offering them help — whether it\'s running an errand, providing a listening ear, or another act of kindness that feels meaningful to them.',
    virtues: { Kindness: 5, Courage: 3 },
    duration: 'Long',
  },
  {
      prompt:
        'Reach out to a local charity or community organization that you care about and offer to volunteer your time or skills for at least one hour this week.',
      virtues: { Kindness: 5, Courage: 3 },
      duration: 'Long',
    },

  // Empathy — Long
  {
    prompt:
      'Without fixing or advising, write out what you imagine a difficult emotion someone you care about is carrying. Let the writing be about them — their experience, not yours. Don\'t try to solve it.',
    virtues: { Empathy: 5, Kindness: 3 },
    duration: 'Long',
  },

  // Collaboration — Long
  {
    prompt:
      'Make a small contribution to something larger than yourself — an open source project, a community initiative, a shared resource. Contribute something genuine and let it stand on its own without tracking or advertising your input.',
    virtues: { Collaboration: 5, Modesty: 3 },
    duration: 'Long',
  },

  // Tolerance — Long (social immersion, harder)
  {
    prompt:
      'Spend time in a place or context where you are genuinely in the minority — geographically, culturally, or socially. Stay present, observe, and let the experience exist without rushing to compare or judge.',
    virtues: { Tolerance: 5, Courage: 3 },
    duration: 'Long',
  },

  // ─────────────────────────────────────────────────────────────────
  // MEDIUM (10–20 min; moderate, moderate reward)
  // ─────────────────────────────────────────────────────────────────

  // Curiosity — Medium
  {
      prompt:
        'Watch a documentary or short film about an unfamiliar culture or place and write down three aspects of the story that you found surprising or moved you.',
      virtues: { Curiosity: 3, Empathy: 2 },
      duration: 'Medium',
    },
  {
    prompt:
      'Visit a local library or bookstore, pick up a book from a section you\'ve never explored, and spend at least 10 minutes browsing through its content. Take note of any new concepts or ideas you encounter.',
    virtues: { Curiosity: 3, 'Proper Ambition': 2 },
    duration: 'Medium',
  },
  {
      prompt:
        'Research a topic you\'ve always been curious about but never took the time to dive into. Spend 10–15 minutes finding credible sources and write three things you learned.',
      virtues: { Curiosity: 3, Discipline: 2 },
      duration: 'Medium',
    },
  {
    prompt:
      'Explore a topic you\'ve always been curious about but never researched. Spend 15 minutes reading or watching something about it, and jot down three new insights you gained. Consider if this knowledge challenges you or inspires a personal ambition.',
    virtues: { Curiosity: 3, 'Proper Ambition': 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Take 15 minutes to explore a topic you\'ve never delved into before. Begin by choosing a new subject that piques your curiosity. Conduct a brief search or read a short article, noting down three interesting facts and one bold question.',
    virtues: { Curiosity: 3, Courage: 2 },
    duration: 'Medium',
  },

  // Courage — Medium
  {
    prompt:
      'Approach someone you\'ve been meaning to connect with — colleague, neighbor, or acquaintance — and start a genuine conversation. Ask them a meaningful question about their interests or share an interesting personal story to break the ice.',
    virtues: { Courage: 3, 'Proper Ambition': 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Approach a colleague or neighbor whom you don\'t know very well. Start a conversation by asking them about their interests or recent experiences. Aim to learn something new about them and briefly share something about yourself in return.',
    virtues: { Courage: 3, Curiosity: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Identify a task or conversation you\'ve been avoiding out of fear or uncertainty. Take a bold step today: schedule or initiate this task or conversation within the next few hours. Reflect on how taking this step made you feel.',
    virtues: { Courage: 3, 'Proper Ambition': 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Engage in a conversation with someone you admire but have never spoken to before. Ask them at least three open-ended questions about their life or work, and listen actively to their responses.',
    virtues: { Courage: 3, Curiosity: 2 },
    duration: 'Medium',
  },

  // Proper Ambition — Medium
  {
    prompt:
      'Identify a long-term goal you\'ve been considering but have not yet acted upon. Break it down into at least three actionable steps you can start in the next month. Complete the first step today, no matter how small, to initiate momentum.',
    virtues: { 'Proper Ambition': 3, Discipline: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Identify a skill or knowledge area you\'ve been curious about but haven\'t pursued yet. Spend an hour today researching and outlining a small project or goal you can realistically achieve within the next month.',
    virtues: { 'Proper Ambition': 3, Curiosity: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Set a meaningful goal for the next month in an area where you aspire to grow. Identify three resources — books, articles, videos — that can help. Then define three concrete steps you can take this week to get started.',
    virtues: { 'Proper Ambition': 3, Curiosity: 2, Discipline: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Set a personal goal that you want to achieve within the next three months. Clearly define what success looks like and list three actionable steps to begin working towards it. Ensure the goal is challenging yet realistic.',
    virtues: { 'Proper Ambition': 3, Discipline: 2 },
    duration: 'Medium',
  },

  // Kindness — Medium
  {
      prompt:
        'Call a friend or family member you haven\'t spoken to in a while and ask how they are doing. Offer your full attention — no multitasking — and let the conversation flow naturally.',
      virtues: { Kindness: 3, Empathy: 2 },
      duration: 'Medium',
    },
  {
    prompt:
      'Reach out to someone you know who might be having a tough time and offer your support. This could be a simple phone call, a thoughtful message, or a brief visit. Show genuine care by asking how you can help.',
    virtues: { Kindness: 3, Empathy: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Identify a colleague or teammate who often contributes but doesn\'t seek recognition. Spend 15–30 minutes writing a sincere and specific acknowledgment of their efforts, detailing how their work positively impacts the team.',
    virtues: { Kindness: 3, Modesty: 2, Collaboration: 2 },
    duration: 'Medium',
  },

  // Modesty — Medium
  {
    prompt:
      'Seek an opportunity today to praise a colleague, friend, or family member for their achievements or skills. Make sure the praise highlights their strengths without comparing them to yourself.',
    virtues: { Modesty: 3, Respectfulness: 2, 'Proper Ambition': 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Reflect on a recent team project or group activity in which you participated. Identify one specific contribution from a teammate that was crucial to the success of the project. Write them a short note expressing your appreciation — avoid mentioning your own contributions.',
    virtues: { Modesty: 3, Respectfulness: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Identify one area in your life where you feel successful and write down three humble statements about your achievements that acknowledge the contributions of others or external factors. Ask someone you respect for their perspective on your modesty.',
    virtues: { Modesty: 3, Respectfulness: 2 },
    duration: 'Medium',
  },

  // Discipline — Medium
  {
    prompt:
      'Choose a task you\'ve been procrastinating on and spend 15 minutes today working on it without distractions. Focus solely on progressing with the task — whether it\'s organizing a cluttered area, responding to pending emails, or working on a personal project.',
    virtues: { Discipline: 3, Temperance: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Identify a daily habit you want to improve. Set a timer for 10 minutes and work on enhancing consistency in that habit today. Focus on maintaining balance to prevent burnout.',
    virtues: { Discipline: 3, Temperance: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Plan your meals for the next day, ensuring you include a balance of healthy foods and allocate appropriate portions. Spend 10–15 minutes preparing a detailed plan, focusing on portion control and nutrition.',
    virtues: { Discipline: 3, Temperance: 2, 'Proper Ambition': 1 },
    duration: 'Medium',
  },

  // Temperance — Medium
  {
    prompt:
      'Prepare and enjoy a balanced meal at home, mindful of portion sizes and nutritional content. Focus on savoring each bite, eating slowly, and stopping when you feel satisfied but not overly full. Reflect on how it affects your mood and energy.',
    virtues: { Temperance: 3, Discipline: 2, Resilience: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Today, practice temperance by setting a limit on your social media usage to no more than 30 minutes. Use a timer to track your usage and when it ends, take a moment to reflect on how you feel after disconnecting. Use the extra time for something relaxing or productive you often postpone.',
    virtues: { Temperance: 3, Discipline: 2, Resilience: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Set aside 30 minutes to mindfully plan your meals, considering portions, nutritional balance, and how they align with your health goals. Practice moderation by allocating reasonable portions, and ensure your plan leaves room for adjustments.',
    virtues: { Temperance: 3, Discipline: 2, Resilience: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Notice a habitual impulse today — to snack, to buy, to check your phone — and pause before acting on it. Choose a substitute activity and notice how the impulse passes or changes.',
    virtues: { Temperance: 3, Discipline: 2 },
    duration: 'Medium',
  },

  // Patience — Medium
  {
    prompt:
      'Sit quietly for 10 minutes without distraction. Let thoughts arise and settle naturally. When you feel the urge to check the time, let it be.',
    virtues: { Patience: 3, Discipline: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Engage in a conversation with someone whose views differ from yours. Focus solely on listening and understanding their perspective for five minutes without interrupting or offering your own opinion.',
    virtues: { Patience: 3, Tolerance: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Practice cooking or preparing a meal with full attention to each step — even if it takes longer than usual. Notice the impulse to rush and let it go.',
    virtues: { Patience: 3, Temperance: 2 },
    duration: 'Medium',
  },

  // Empathy — Medium
  {
    prompt:
      'Read or listen to a personal story from someone whose background differs from yours. Without agreeing or disagreeing, simply reflect on what their experience might feel like from the inside.',
    virtues: { Empathy: 3, Tolerance: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Write about a time someone else\'s courage quietly moved you — not the dramatic kind, but the small, everyday kind. What did their choice reveal about them?',
    virtues: { Empathy: 3, Respectfulness: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Recall a moment when someone around you was visibly affected by something — tired, sad, distracted. Without asking or offering anything, just notice what their experience might be. Write a brief observation.',
    virtues: { Empathy: 3, Patience: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Think of a meaningful gift someone gave you — not the object itself but what it meant that they thought of you. Write a few sentences about what it revealed about how they see you.',
    virtues: { Empathy: 3, Kindness: 2 },
    duration: 'Medium',
  },

  // Collaboration — Medium
  {
    prompt:
      'Notice when you\'re dominating a group conversation and actively make space for others\' voices. Ask someone what they think before sharing your own view.',
    virtues: { Collaboration: 3, Discipline: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Do your part in a shared task — household, project, or group responsibility — without reminding anyone else of their part. Let your contribution stand on its own.',
    virtues: { Collaboration: 3, Kindness: 2 },
    duration: 'Medium',
  },

  // Resilience — Medium
  {
    prompt:
      'Continue a physical practice — stretching, walking, lifting — even when you feel like stopping. Stop before you cause injury, but push through the first urge to quit. Notice what you\'re capable of that you doubted.',
    virtues: { Resilience: 3, Discipline: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Do something today that\'s part of a longer project, knowing you won\'t see results yet. Show up for the process, not the outcome.',
    virtues: { Resilience: 3, Discipline: 2 },
    duration: 'Medium',
  },

  // Respectfulness — Medium
  {
    prompt:
      'Listen to a piece of music, art, or writing from a tradition you don\'t know well — and give it genuine attention before forming an opinion. Let it exist on its own terms.',
    virtues: { Respectfulness: 3, Curiosity: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Ask someone whose views differ from yours to explain their perspective. Listen to understand — not to respond. Then, if appropriate, share your own view without correcting theirs.',
    virtues: { Respectfulness: 3, Tolerance: 2 },
    duration: 'Medium',
  },

  // Tolerance — Medium
  {
    prompt:
      'Engage with an unfamiliar cultural practice — a food, a piece of music, a tradition — and let it exist without rushing to compare it to your own or judge it.',
    virtues: { Tolerance: 3, Respectfulness: 2 },
    duration: 'Medium',
  },
  {
    prompt:
      'Ask someone whose views differ from yours to explain their perspective without inserting your own. Listen fully before responding.',
    virtues: { Tolerance: 3, Respectfulness: 2 },
    duration: 'Medium',
  },

  // ─────────────────────────────────────────────────────────────────
  // SHORT (under 5 min; solo, lower reward but high variety)
  // ─────────────────────────────────────────────────────────────────

  // Curiosity — Short
  {
    prompt:
      'Choose a common object near you and spend 5 minutes observing it carefully — then write down three details you hadn\'t noticed before.',
    virtues: { Curiosity: 2, Patience: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Find a new word in the dictionary or online, and use it in a sentence related to your career or personal goals.',
    virtues: { Curiosity: 2, 'Proper Ambition': 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Pick up a book you\'ve never read before, open it to a random page, and read one paragraph. What new idea or concept did it bring up?',
    virtues: { Curiosity: 2, 'Proper Ambition': 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Take five minutes to explore something new within your immediate environment — identifying a plant, finding an interesting fact about an object in your home, or learning a new feature on a device you own. Reflect on how it could connect to a bigger interest.',
    virtues: { Curiosity: 2, 'Proper Ambition': 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Spend five minutes exploring a topic you\'ve always been curious about. Use a search engine to find one new, fascinating fact. Write it down and note what question it raises for you.',
    virtues: { Curiosity: 2, 'Proper Ambition': 1 },
    duration: 'Short',
  },

  // Courage — Short (solo inward / lower friction)
  {
    prompt:
      'Introduce yourself to someone new today — in person or online — and learn one interesting fact about them.',
    virtues: { Courage: 2, 'Proper Ambition': 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Identify a small fear or hesitation you have about trying something new today, then take a step to face it — whether it\'s speaking up in a meeting, trying a new approach at work, or doing something unfamiliar. Write a brief reflection on what you noticed.',
    virtues: { Courage: 2, Curiosity: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Approach someone you\'ve been hesitant to talk to and initiate a conversation — even if it\'s just to say hello or introduce yourself.',
    virtues: { Courage: 2, 'Proper Ambition': 1 },
    duration: 'Short',
  },

  // Proper Ambition — Short
  {
    prompt:
      'Identify one small, achievable step you can take today towards a larger personal or professional goal you\'re working on. Write it down and commit to doing it.',
    virtues: { 'Proper Ambition': 2, Discipline: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Identify one specific goal you want to achieve by the end of this week. Write down the first three steps you will take towards achieving it.',
    virtues: { 'Proper Ambition': 2, Discipline: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Identify a single ambitious goal you want to achieve in the next month. Write it down, then list one small action you can take today to move towards this goal.',
    virtues: { 'Proper Ambition': 2, Curiosity: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Write one achievable goal for today that aligns with your long-term aspirations and plan one specific action you will take to move towards it.',
    virtues: { 'Proper Ambition': 2, Discipline: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Set a timer for 5 minutes and brainstorm a list of five achievable goals you want to accomplish this month. Prioritize them from most to least important and consider how each aligns with your long-term aspirations.',
    virtues: { 'Proper Ambition': 2, Discipline: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Identify one ambition you\'ve been hesitant to pursue. Take one small step toward it today by researching a relevant resource or writing down what\'s holding you back.',
    virtues: { 'Proper Ambition': 2, Courage: 1 },
    duration: 'Short',
  },

  // Kindness — Short (material, low friction)
  {
    prompt:
      'Leave an encouraging note for a family member or colleague to brighten their day. Write something specific about what you appreciate about them.',
    virtues: { Kindness: 2, Modesty: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Surprise a colleague, friend, or family member by performing a small, unexpected act of kindness today — buying them a coffee, helping them with a task, or giving them a kind note.',
    virtues: { Kindness: 2, Courage: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Send a thoughtful message to someone who might need a little encouragement or support today — whether it\'s a friend, family member, or colleague.',
    virtues: { Kindness: 2, Empathy: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Do something small for someone in your household — make the bed, start a load of laundry, prepare a glass of water — without being asked and without mentioning it.',
    virtues: { Kindness: 2, Temperance: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Write a short note of appreciation for someone who\'s supported you in a way you\'ve never properly acknowledged. Be specific about what they did and why it mattered.',
    virtues: { Kindness: 2, Modesty: 1 },
    duration: 'Short',
  },

  // Modesty — Short
  {
    prompt:
      'In private, write down one thing you did well recently — and genuinely credit the people, circumstances, or luck that made it possible. No false humility, just honest acknowledgment.',
    virtues: { Modesty: 2, Respectfulness: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Think of something another person did well recently. Write a genuine compliment for them — specific, no comparison to yourself — and decide whether to share it.',
    virtues: { Modesty: 2, Kindness: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Write down one thing you\'re not yet good at. Read it back and see if you can say something kind to yourself about the gap — without dismissing it or inflating it.',
    virtues: { Modesty: 2, Patience: 1 },
    duration: 'Short',
  },

  // Discipline — Short (physical, maker)
  {
    prompt:
      'Set a timer for 5 minutes and organize one small area of your space — a drawer, a shelf, a corner. Focus on making it functional, not perfect. When the timer ends, stop.',
    virtues: { Discipline: 2, Temperance: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Complete a 5-minute stretching or movement routine. Maintain a steady pace without rushing, and stay present with your breath throughout.',
    virtues: { Discipline: 2, Patience: 1, Resilience: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Start something messy — a sketch, a draft, a prototype. Spend 5 minutes building something with no expectation of quality. Show up before you\'re ready.',
    virtues: { Discipline: 2, Resilience: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Write down the one task you\'ve been putting off most. Spend 5 minutes on it — not to finish, just to begin.',
    virtues: { Discipline: 2, 'Proper Ambition': 1 },
    duration: 'Short',
  },

  // Temperance — Short
  {
    prompt:
      'Eat one meal or snack with full attention — no phone, no multitasking. Notice flavor, texture, and when you feel satisfied. Write a brief reflection on how it felt.',
    virtues: { Temperance: 2, Patience: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Notice a bodily signal — hunger, tension, fatigue — today and respond to it with care rather than overriding it with more work, more food, or more stimulation.',
    virtues: { Temperance: 2, Discipline: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Set a timer for 5 minutes and sit quietly without filling the time — no music, no screen, no reading. Let the silence be without agenda.',
    virtues: { Temperance: 2, Patience: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Choose one unnecessary purchase you\'d normally make this week and skip it. Notice what arises when you don\'t buy it.',
    virtues: { Temperance: 2, Discipline: 1 },
    duration: 'Short',
  },

  // Patience — Short
  {
    prompt:
      'Wait for something — an answer, a result, a person — without filling the wait with your phone. Notice what arises when you\'re simply present with nothing to do.',
    virtues: { Patience: 2, Temperance: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'In a situation where you want to rush to judgment or interrupt, deliberately slow down. Let three more seconds pass before speaking.',
    virtues: { Patience: 2, Respectfulness: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Let someone finish speaking without planning your response while they talk. Listen fully — then pause before you reply.',
    virtues: { Patience: 2, Respectfulness: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Do one thing at a slower pace than usual today — walk, eat, wash dishes. Notice what changes in the quality of the experience.',
    virtues: { Patience: 2, Temperance: 1 },
    duration: 'Short',
  },

  // Empathy — Short
  {
    prompt:
      'Imagine the inner life of someone you pass daily but don\'t know — a neighbor, barista, delivery driver — and write one paragraph imagining what their day might be like.',
    virtues: { Empathy: 2, Curiosity: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Recall a memory of someone else\'s kindness that you\'ve never properly acknowledged. Write a few sentences about what it meant to you, and consider whether to let them know.',
    virtues: { Empathy: 2, Kindness: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Think of someone who recently frustrated you. Imagine one possible explanation for their behavior that you\'d never heard them give. Write it down without needing to believe it.',
    virtues: { Empathy: 2, Patience: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Recall a time you saw someone struggling and it reminded you of your own difficult moment. Write a few sentences connecting those experiences — what you share, not what\'s different.',
    virtues: { Empathy: 2, Resilience: 1 },
    duration: 'Short',
  },

  // Collaboration — Short
  {
    prompt:
      'Share something you genuinely learned from a teammate or group recently — with specifics about what they contributed — and let it stand without diminishing your own role.',
    virtues: { Collaboration: 2, Modesty: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'In a group conversation today, ask someone else\'s opinion before sharing your own. Listen to their answer without steering it.',
    virtues: { Collaboration: 2, Respectfulness: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Finish someone else\'s thought when they\'re struggling to articulate it — mirroring back what you hear — to help them land their point. Do it without taking over.',
    virtues: { Collaboration: 2, Empathy: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Do one small thing today that makes a shared space or process easier for others — without being asked, and without mentioning it later.',
    virtues: { Collaboration: 2, Kindness: 1 },
    duration: 'Short',
  },

  // Resilience — Short
  {
    prompt:
      'Start something today where the outcome is uncertain and you might not succeed. Begin anyway and see what shows up.',
    virtues: { Resilience: 2, Courage: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Return to a habit you dropped. Don\'t restart perfectly — just begin again, without self-recrimination, and notice how it feels to show up again.',
    virtues: { Resilience: 2, Discipline: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Sit with an uncomfortable emotion for five minutes before trying to fix or escape it. Name it. Let it be there.',
    virtues: { Resilience: 2, Patience: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'When something doesn\'t go your way today, write down one thing you lost and one thing you still have.',
    virtues: { Resilience: 2, Patience: 1 },
    duration: 'Short',
  },

  // Respectfulness — Short
  {
    prompt:
      'Write down one genuine way someone you\'ve never properly thanked contributed to something important to you. Decide whether to tell them.',
    virtues: { Respectfulness: 2, Kindness: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Speak or write about someone who shaped you, focusing entirely on their qualities and contributions — not your relationship to them.',
    virtues: { Respectfulness: 2, Modesty: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Treat a difficult person with the same basic courtesy you\'d show someone you admire — a greeting, a acknowledgment, a patient tone. See what happens.',
    virtues: { Respectfulness: 2, Temperance: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Acknowledge someone\'s contribution today even when it would be easier to stay quiet. Say it directly to them if you can.',
    virtues: { Respectfulness: 2, Kindness: 1 },
    duration: 'Short',
  },

  // Tolerance — Short
  {
    prompt:
      'Read or listen to a viewpoint you disagree with and seek only to understand — not to refute or evaluate. Notice what\'s familiar in what they\'re saying.',
    virtues: { Tolerance: 2, Curiosity: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Notice when your first instinct is to dismiss something unfamiliar — an idea, a food, a way of doing things. Pause and ask what you might be missing.',
    virtues: { Tolerance: 2, Curiosity: 1 },
    duration: 'Short',
  },
  {
    prompt:
      'Be around someone whose energy or mood is different from yours today — quieter, louder, more anxious, more optimistic — without trying to change it. Let them be as they are.',
    virtues: { Tolerance: 2, Patience: 1 },
    duration: 'Short',
  },
];