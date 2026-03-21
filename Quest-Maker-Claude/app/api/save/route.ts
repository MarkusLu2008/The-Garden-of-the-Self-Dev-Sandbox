import { NextResponse } from 'next/server';
import type { QuestSeedItem } from '@/lib/questTypes';
import { appendQuest, readQuests, regenerateSeedTs } from '@/lib/questStorage';

export async function POST(request: Request) {
  try {
    const quest: QuestSeedItem = await request.json();

    appendQuest(quest);
    const allQuests = readQuests();
    regenerateSeedTs(allQuests);

    return NextResponse.json({ success: true, total: allQuests.length });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save quest' }, { status: 500 });
  }
}
