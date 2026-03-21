import { NextResponse } from 'next/server';
import type { QuestDuration } from '@/lib/questTypes';
import { VIRTUES } from '@/lib/virtues';
import { readQuests } from '@/lib/questStorage';
import { getCoveredComboCount, getTotalPossibleCombos } from '@/lib/questCoverage';

export type VirtueStats = {
  primary: Record<QuestDuration, number>;
  secondaryTotal: number;
};

function getPrimaryVirtue(virtues: Record<string, number>): string {
  const entries = Object.entries(virtues);
  if (entries.length === 0) return '';
  return entries.sort(([, a], [, b]) => b - a)[0][0];
}

export async function GET() {
  try {
    const quests = readQuests();

    const stats: Record<string, VirtueStats> = {};
    for (const virtue of VIRTUES) {
      stats[virtue] = { primary: { Short: 0, Medium: 0, Long: 0 }, secondaryTotal: 0 };
    }

    for (const quest of quests) {
      const entries = Object.entries(quest.virtues).sort(([, a], [, b]) => b - a);
      if (entries.length === 0) continue;

      const primary = getPrimaryVirtue(quest.virtues);
      if (stats[primary]) {
        stats[primary].primary[quest.duration]++;
      }

      for (let i = 1; i < entries.length; i++) {
        const secondary = entries[i][0];
        if (stats[secondary]) {
          stats[secondary].secondaryTotal++;
        }
      }
    }

    const totalPossibleCombos = getTotalPossibleCombos();
    const coveredCombos = getCoveredComboCount(quests);

    return NextResponse.json({
      stats,
      total: quests.length,
      coverage: {
        coveredCombos,
        totalPossibleCombos,
        percent: totalPossibleCombos === 0 ? 0 : (coveredCombos / totalPossibleCombos) * 100,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
