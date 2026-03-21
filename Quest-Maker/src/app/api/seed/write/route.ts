import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SeedPayloadSchema } from '@/lib/api-types';
import { validateQuestAgainstDominant } from '@/lib/virtue-compatibility';
import {
  buildDiffPreview,
  loadSeedFileContent,
  mergeQuestsIntoSeed,
  persistSeedFileContent,
  resolveSeedFilePath,
} from '@/lib/seed-file-writer';

export const runtime = 'nodejs';

const SeedWriteSchema = SeedPayloadSchema.extend({
  apply: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = SeedWriteSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { dominantVirtue, quests, apply } = parsed.data;
    const issues = quests.flatMap((quest, index) =>
      validateQuestAgainstDominant(quest, dominantVirtue).map((message) => ({
        questIndex: index,
        message,
      })),
    );
    if (issues.length > 0) {
      return NextResponse.json({ error: 'Validation failed', issues }, { status: 422 });
    }

    const seedFilePath = resolveSeedFilePath();
    const previousContent = await loadSeedFileContent(seedFilePath);
    const merge = mergeQuestsIntoSeed(previousContent, quests);
    const diffPreview = buildDiffPreview(previousContent, merge.nextContent);

    if (!apply) {
      return NextResponse.json({
        dryRun: true,
        seedFilePath,
        addedCount: merge.added.length,
        skippedCount: merge.skipped.length,
        diffPreview,
      });
    }

    await persistSeedFileContent(merge.nextContent, seedFilePath);
    return NextResponse.json({
      dryRun: false,
      seedFilePath,
      addedCount: merge.added.length,
      skippedCount: merge.skipped.length,
      diffPreview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
