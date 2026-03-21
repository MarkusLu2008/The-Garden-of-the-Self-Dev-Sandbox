import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { GenerateSettings } from '@/lib/questTypes';

const client = new OpenAI(); // reads OPENAI_API_KEY from env
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 350;
type GenerateRequest = GenerateSettings & { themeFocus?: string };

const POINT_RANGES: Record<string, { primary: string; secondary: string }> = {
  Short: { primary: '4–7', secondary: '1–3' },
  Medium: { primary: '8–13', secondary: '1–4' },
  Long: { primary: '12–18', secondary: '1–4' },
};

const VIRTUE_DESCRIPTIONS: Record<string, string> = {
  Curiosity: 'exploring, learning, asking open questions',
  Courage: 'facing fear, taking meaningful risks, being bold',
  'Proper Ambition': 'aiming high in a balanced, grounded way',
  Kindness: 'caring for and helping others with genuine generosity',
  Modesty: 'humility, realistic self-view, not seeking the spotlight',
  Discipline: 'consistency, self-control, follow-through on commitments',
  Resilience: 'bouncing back from setbacks, enduring hardship',
  Patience: 'waiting calmly, steady pacing, not forcing outcomes',
  Temperance: 'balance and moderation in all things',
  Empathy: 'understanding and feeling others\' perspectives',
  Collaboration: 'working effectively and generously with others',
  Tolerance: 'accepting difference without judgment',
  Respectfulness: 'honoring others, their time, norms, and spaces',
};

function isRetriableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeErr = error as {
    code?: string;
    status?: number;
    cause?: { code?: string };
  };

  const code = maybeErr.code ?? maybeErr.cause?.code;
  if (code === 'ERR_STREAM_PREMATURE_CLOSE') return true;

  const status = maybeErr.status;
  return status === 408 || status === 429 || (typeof status === 'number' && status >= 500);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function createQuestWithRetry(
  systemPrompt: string,
  userMessage: string
): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');
      return JSON.parse(content);
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_RETRIES || !isRetriableError(error)) break;
      await sleep(BASE_RETRY_DELAY_MS * 2 ** attempt);
    }
  }

  throw lastError;
}

export async function POST(request: Request) {
  const { primaryVirtue, secondaryVirtues, duration, count = 3, themeFocus }: GenerateRequest =
    await request.json();
  const normalizedThemeFocus = themeFocus?.trim();

  const { primary: primaryRange, secondary: secondaryRange } = POINT_RANGES[duration];

  const virtueDescLines = [primaryVirtue, ...secondaryVirtues]
    .map((v) => `- ${v}: ${VIRTUE_DESCRIPTIONS[v] ?? v}`)
    .join('\n');

  const systemPrompt = `You are a quest designer for "Garden of the Self", a personal growth journaling app.
Quests are single-day challenges that help users practice specific virtues through concrete actions.

Relevant virtues for this quest:
${virtueDescLines}

You will return a JSON object with EXACTLY this structure:
{
  "prompt": "<quest text>",
  "virtues": { "<VirtueName>": <points>, ... },
  "duration": "<Short|Medium|Long>"
}

Rules:
- The prompt must be a clear, specific, actionable challenge completable in one day.
- The primary virtue (${primaryVirtue}) must appear in "virtues" with ${primaryRange} points (this is a ${duration} difficulty quest).
- Secondary virtues (if any) must appear with ${secondaryRange} points each.
- Do NOT add virtues beyond the primary and the specified secondaries.
- The "duration" field must be exactly "${duration}".
- Do not start the prompt with "Today's quest:", or any phrases make it direct
- If possible make them specific less open ended expecially for short duration quests
- If its a reflection make it a question or statement where a conclusion could be reached.
- Try not to make them write a reflection
- Short quest must be something they can do in 5 minutes or less.
- Medium quest must be something they can do in 10 minutes to 15 minutes.
- Long quest must be something they can do in 15 minutes to 30 minutes.
- DO NOT EXCEED THE 30 minutes time limit for any quest.
- If an activity focus is provided, strongly bias the quest context toward that focus while still satisfying all virtue and duration rules.
- Return ONLY the JSON object — no markdown, no explanation, no code blocks.`;

  const userMessage = `Generate a quest with:
- Primary virtue: ${primaryVirtue}
${secondaryVirtues.length > 0 ? `- Secondary virtues: ${secondaryVirtues.join(', ')}` : '- No secondary virtues'}
- Difficulty / duration: ${duration}
${normalizedThemeFocus ? `- Activity focus: ${normalizedThemeFocus}` : '- Activity focus: none'}`;

  try {
    const n = Math.max(1, Math.min(count, 20));
    const calls = Array.from({ length: n }, () => createQuestWithRetry(systemPrompt, userMessage));
    const quests = await Promise.all(calls);

    return NextResponse.json({ quests });
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quest. Please retry in a moment.' },
      { status: 500 }
    );
  }
}
