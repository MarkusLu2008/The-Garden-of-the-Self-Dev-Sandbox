import { NextResponse } from 'next/server';
import { readQuests } from '@/lib/questStorage';
import {
  loadSeedFileContent,
  mergeQuestsIntoSeed,
  persistSeedFileContentAtomic,
  resolveSeedFilePath,
} from '@/lib/questSeedFile';
import { validateAndSanitizeQuest } from '@/lib/questValidation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validation = validateAndSanitizeQuest(payload);
    if (!validation.ok) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.issues },
        { status: 422 },
      );
    }

    const seedFilePath = resolveSeedFilePath();
    const previousContent = await loadSeedFileContent(seedFilePath);
    const mergeResult = mergeQuestsIntoSeed(previousContent, [validation.value]);
    if (mergeResult.added.length > 0) {
      await persistSeedFileContentAtomic(mergeResult.nextContent, seedFilePath);
    }
    const total = readQuests().length;

    return NextResponse.json({
      success: true,
      total,
      added: mergeResult.added.length,
      skipped: mergeResult.skipped.length,
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save quest' }, { status: 500 });
  }
}
