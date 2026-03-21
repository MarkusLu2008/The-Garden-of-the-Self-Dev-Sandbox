'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatsView from '@/components/StatsView';
import type { QuestDuration } from '@/lib/questTypes';

type VirtueStats = {
  primary: Record<QuestDuration, number>;
  secondaryTotal: number;
};

type StatsData = {
  stats: Record<string, VirtueStats>;
  total: number;
  coverage: {
    coveredCombos: number;
    totalPossibleCombos: number;
    percent: number;
  };
};

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Quest Library — Stats</h1>
          <p className="text-xs text-gray-500 mt-0.5">Garden of the Self</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchStats}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            ↺ Refresh
          </button>
          <Link
            href="/"
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            ← Generator
          </Link>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-6">
          {loading ? (
            <p className="text-gray-500 text-sm py-8 text-center">Loading…</p>
          ) : data ? (
            <StatsView stats={data.stats} total={data.total} coverage={data.coverage} />
          ) : (
            <p className="text-red-400 text-sm">Failed to load stats.</p>
          )}
        </div>
      </main>
    </div>
  );
}
