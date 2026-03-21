'use client';

import { VIRTUES } from '@/lib/virtues';
import type { QuestDuration } from '@/lib/questTypes';

type VirtueStats = {
  primary: Record<QuestDuration, number>;
  secondaryTotal: number;
};

interface Props {
  stats: Record<string, VirtueStats>;
  total: number;
}

function Cell({ count }: { count: number }) {
  return (
    <td
      className={`text-center py-2.5 px-2 text-sm tabular-nums ${
        count === 0 ? 'text-red-400 font-semibold' : 'text-gray-300'
      }`}
    >
      {count}
    </td>
  );
}

export default function StatsView({ stats, total }: Props) {
  const zeros = VIRTUES.flatMap((v) => {
    const s = stats[v];
    if (!s) return [];
    return (['Short', 'Medium', 'Long'] as QuestDuration[]).filter((d) => s.primary[d] === 0).map((d) => `${v} / ${d}`);
  });

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-6">
        <p className="text-2xl font-bold text-white">{total}</p>
        <p className="text-sm text-gray-400">quests in library</p>
        {zeros.length > 0 && (
          <p className="ml-auto text-xs text-red-400">{zeros.length} gaps (red)</p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 border-b border-gray-700">
              <th className="text-left py-2 pr-4">Virtue</th>
              <th className="text-center py-2 px-2">Short</th>
              <th className="text-center py-2 px-2">Medium</th>
              <th className="text-center py-2 px-2">Long</th>
              <th className="text-center py-2 px-2 text-gray-600">2° total</th>
            </tr>
          </thead>
          <tbody>
            {VIRTUES.map((virtue) => {
              const s = stats[virtue];
              if (!s) return null;
              const primaryTotal = s.primary.Short + s.primary.Medium + s.primary.Long;
              return (
                <tr key={virtue} className="border-b border-gray-800 hover:bg-gray-700/30">
                  <td className="py-2.5 pr-4 text-gray-200">
                    {virtue}
                    <span className="ml-2 text-[11px] text-gray-600">({primaryTotal})</span>
                  </td>
                  <Cell count={s.primary.Short} />
                  <Cell count={s.primary.Medium} />
                  <Cell count={s.primary.Long} />
                  <td className="text-center py-2.5 px-2 text-sm text-gray-600 tabular-nums">
                    {s.secondaryTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
