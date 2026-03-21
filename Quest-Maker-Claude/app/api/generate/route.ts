import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { GenerateSettings } from '@/lib/questTypes';

const client = new OpenAI(); // reads OPENAI_API_KEY from env

const POINT_RANGES: Record<string, { primary: string; secondary: string }> = {
  Short: { primary: '4–7', secondary: '1–3' },
  Medium: { primary: '8–13', secondary: '1–5' },
  Long: { primary: '12–18', secondary: '1–5' },
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

export async function POST(request: Request) {
  const { primaryVirtue, secondaryVirtues, duration, count = 1 }: GenerateSettings =
    await request.json();

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
- Return ONLY the JSON object — no markdown, no explanation, no code blocks.`;

  const userMessage = `Generate a quest with:
- Primary virtue: ${primaryVirtue}
${secondaryVirtues.length > 0 ? `- Secondary virtues: ${secondaryVirtues.join(', ')}` : '- No secondary virtues'}
- Difficulty / duration: ${duration}`;

  try {
    const n = Math.max(1, Math.min(count, 20));
    const calls = Array.from({ length: n }, () =>
      client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9,
      })
    );

    const responses = await Promise.all(calls);
    const quests = responses.map((r) => {
      const content = r.choices[0].message.content;
      if (!content) throw new Error('Empty response from OpenAI');
      return JSON.parse(content);
    });

    return NextResponse.json({ quests });
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quest. Check your OPENAI_API_KEY.' },
      { status: 500 }
    );
  }
}
