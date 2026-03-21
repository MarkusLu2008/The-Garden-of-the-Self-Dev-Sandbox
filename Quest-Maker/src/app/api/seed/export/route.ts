import { NextResponse } from 'next/server';
import { SeedPayloadSchema } from '@/lib/api-types';
import { validateQuestAgainstDominant } from '@/lib/virtue-compatibility';
import { buildQuestSeedSnippet } from '@/lib/seed-file-writer';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = SeedPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { dominantVirtue, quests } = parsed.data;
    const issues = quests.flatMap((quest, index) =>
      validateQuestAgainstDominant(quest, dominantVirtue).map((message) => ({
        questIndex: index,
        message,
      })),
    );

    if (issues.length > 0) {
      return NextResponse.json({ error: 'Validation failed', issues }, { status: 422 });
    }

    const snippet = buildQuestSeedSnippet(quests);
    return NextResponse.json({ snippet, count: quests.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
