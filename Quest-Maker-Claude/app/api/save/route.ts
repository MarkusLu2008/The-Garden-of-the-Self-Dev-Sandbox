import { NextResponse } from 'next/server';
import type { QuestSeedItem } from '@/lib/questTypes';
import { appendQuest, readQuests } from '@/lib/questStorage';

export async function POST(request: Request) {
  try {
    const quest: QuestSeedItem = await request.json();

    appendQuest(quest);
    const total = readQuests().length;

    return NextResponse.json({ success: true, total });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save quest' }, { status: 500 });
  }
}
