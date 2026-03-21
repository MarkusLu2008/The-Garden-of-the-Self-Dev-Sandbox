import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import {
  GenerateQuestsApiRequestSchema,
  type BatchDiagnostics,
  type GenerateQuestsApiRequest,
  type GeneratedQuestResponse,
} from '@/lib/api-types';
import { DOMINANT_COMPANION_MAP, normalizeQuestAgainstDominant } from '@/lib/virtue-compatibility';
import { QuestSeedItemSchema } from '@/lib/seed-types';

export const runtime = 'nodejs';

type OpenAiRawResponse = {
  quests: Array<{
    prompt: string;
    virtues: Record<string, number>;
    duration: 'Long' | 'Medium' | 'Short';
  }>;
};

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }
  const blockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (blockMatch?.[1]) {
    return blockMatch[1].trim();
  }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  throw new Error('Model did not return valid JSON.');
}

function buildSystemPrompt(): string {
  return [
    'You generate quest seed items for a virtue journaling app.',
    'Return ONLY JSON with shape: {"quests":[{prompt, virtues, duration}]}',
    'Rules:',
    '- Each quest prompt must be concrete, actionable, and one paragraph.',
    '- virtues is an object mapping virtue names to positive integers.',
    '- Include dominant virtue in every quest with the highest value.',
    '- duration must exactly match Long, Medium, or Short.',
    '- Do not include any prose outside JSON.',
  ].join('\n');
}

function buildUserPrompt(input: GenerateQuestsApiRequest): string {
  const allowedCompanions = DOMINANT_COMPANION_MAP[input.dominantVirtue];
  return [
    `Generate ${input.count} quests.`,
    `Dominant virtue: ${input.dominantVirtue}`,
    `Requested companions: ${input.companionVirtues.join(', ') || '(none)'}`,
    `Allowed companions for this dominant virtue: ${allowedCompanions.join(', ') || '(none)'}`,
    `Duration for every quest: ${input.duration}`,
    'Output strict JSON only.',
  ].join('\n');
}

function buildBatchDiagnostics(input: GenerateQuestsApiRequest): BatchDiagnostics {
  const allowedCompanions = DOMINANT_COMPANION_MAP[input.dominantVirtue];
  const warningMessages = input.companionVirtues
    .filter((virtue) => !allowedCompanions.includes(virtue))
    .map(
      (virtue) =>
        `Requested companion "${virtue}" is incompatible with dominant virtue "${input.dominantVirtue}" and may be removed.`,
    );
  return {
    warningMessages,
    dominantVirtue: input.dominantVirtue,
    allowedCompanions,
  };
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = GenerateQuestsApiRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is missing. Set it in your environment.' },
        { status: 500 },
      );
    }

    const input = parsed.data;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = input.model ?? 'gpt-4.1-mini';
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.9,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI response was empty.');
    }

    const parsedJson = JSON.parse(extractJsonObject(content)) as OpenAiRawResponse;
    if (!Array.isArray(parsedJson.quests)) {
      throw new Error('OpenAI response missing quests array.');
    }

    const generated: GeneratedQuestResponse[] = parsedJson.quests.map((candidate) => {
      const normalized = normalizeQuestAgainstDominant(
        {
          prompt: candidate.prompt,
          virtues: candidate.virtues ?? {},
          duration: input.duration,
        },
        input.dominantVirtue,
      );
      return normalized;
    });

    const validQuests = generated.filter(({ quest }) => QuestSeedItemSchema.safeParse(quest).success);
    if (validQuests.length === 0) {
      return NextResponse.json(
        {
          error: 'Model output could not be normalized into valid quests.',
          generated,
          batchDiagnostics: buildBatchDiagnostics(input),
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      model,
      generated: validQuests,
      batchDiagnostics: buildBatchDiagnostics(input),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
