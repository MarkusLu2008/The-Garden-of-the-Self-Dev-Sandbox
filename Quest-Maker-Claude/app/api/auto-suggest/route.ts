import { NextResponse } from 'next/server';
import { readQuests } from '@/lib/questStorage';
import { autoSuggestConfig } from '@/lib/autoSuggest';

export async function GET() {
  try {
    const quests = readQuests();
    const suggestion = autoSuggestConfig(quests);
    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Auto-suggest error:', error);
    return NextResponse.json({ error: 'Failed to compute suggestion' }, { status: 500 });
  }
}
