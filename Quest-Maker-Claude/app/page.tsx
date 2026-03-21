'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SettingsPanel from '@/components/SettingsPanel';
import QuestReview from '@/components/QuestReview';
import type { QuestSeedItem, GenerateSettings } from '@/lib/questTypes';

const DEFAULT_SETTINGS: GenerateSettings = {
  primaryVirtue: '',
  secondaryVirtues: [],
  duration: 'Medium',
  count: 1,
};

type Message = { text: string; type: 'success' | 'error' };
type CoverageSummary = {
  coveredCombos: number;
  totalPossibleCombos: number;
  percent: number;
};

export default function Home() {
  const [settings, setSettings] = useState<GenerateSettings>(DEFAULT_SETTINGS);
  const [quests, setQuests] = useState<QuestSeedItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isLoadingAutoSuggest, setIsLoadingAutoSuggest] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [coverage, setCoverage] = useState<CoverageSummary | null>(null);

  const showMessage = (text: string, type: Message['type']) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const refreshCoverage = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const data: { coverage?: CoverageSummary } = await res.json();
      if (data.coverage) setCoverage(data.coverage);
    } catch {
      // Non-blocking UI hint; ignore coverage refresh errors.
    }
  };

  useEffect(() => {
    refreshCoverage();
  }, []);

  const handleGenerate = async () => {
    if (!settings.primaryVirtue) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Generation failed');
      }
      const { quests: generated } = await res.json();
      setQuests(generated);
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Failed to generate quest', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoSuggest = async () => {
    setIsLoadingAutoSuggest(true);
    try {
      const res = await fetch('/api/auto-suggest');
      if (!res.ok) throw new Error('Auto-suggest failed');
      const suggestion: Omit<GenerateSettings, 'count'> = await res.json();
      setSettings((s) => ({ ...s, ...suggestion }));
    } catch {
      showMessage('Auto-suggest failed', 'error');
    } finally {
      setIsLoadingAutoSuggest(false);
    }
  };

  const saveOne = async (quest: QuestSeedItem): Promise<number> => {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quest),
    });
    if (!res.ok) throw new Error('Save failed');
    const { total } = await res.json();
    return total;
  };

  const handleSave = async (idx: number) => {
    setSavingIdx(idx);
    try {
      const total = await saveOne(quests[idx]);
      setQuests((prev) => prev.filter((_, i) => i !== idx));
      await refreshCoverage();
      showMessage(`Quest saved! Library now has ${total} quest${total === 1 ? '' : 's'}.`, 'success');
    } catch {
      showMessage('Failed to save quest', 'error');
    } finally {
      setSavingIdx(null);
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    let total = 0;
    try {
      for (const quest of quests) {
        total = await saveOne(quest);
      }
      setQuests([]);
      await refreshCoverage();
      showMessage(`All ${quests.length} quests saved! Library now has ${total} quests.`, 'success');
    } catch {
      showMessage('Failed to save all quests', 'error');
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Quest Maker</h1>
          <p className="text-xs text-gray-500 mt-0.5">Garden of the Self</p>
        </div>
        <Link
          href="/stats"
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Stats →
        </Link>
      </header>

      {message && (
        <div
          className={`px-6 py-2.5 text-sm transition-all ${
            message.type === 'success'
              ? 'bg-emerald-900/40 text-emerald-300 border-b border-emerald-800/50'
              : 'bg-red-900/40 text-red-300 border-b border-red-800/50'
          }`}
        >
          {message.text}
        </div>
      )}

      <main className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-start">
        <section className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Settings</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSuggest}
                disabled={isLoadingAutoSuggest || isGenerating}
                className="text-xs px-2.5 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingAutoSuggest ? '…' : '✦ Auto-suggest'}
              </button>
              {settings.primaryVirtue && (
                <span className="text-xs text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-full">
                  {settings.primaryVirtue}
                  {settings.secondaryVirtues.length > 0 &&
                    ` + ${settings.secondaryVirtues.join(', ')}`}
                  {' · '}
                  {settings.duration}
                </span>
              )}
            </div>
          </div>
          {coverage && (
            <div className="mb-4 rounded-lg border border-gray-700 bg-gray-900/50 p-3">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="text-xs text-gray-300">Coverage of all possible quest combinations</p>
                <p className="text-xs text-gray-400 tabular-nums">
                  {coverage.coveredCombos} / {coverage.totalPossibleCombos} ({coverage.percent.toFixed(1)}%)
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, coverage.percent))}%` }}
                />
              </div>
            </div>
          )}
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </section>

        <section className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-300">
              {quests.length > 0
                ? `Review & Edit (${quests.length} quest${quests.length === 1 ? '' : 's'})`
                : 'Generated Quests'}
            </h2>
            {quests.length > 1 && (
              <button
                onClick={handleSaveAll}
                disabled={isSavingAll}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingAll ? 'Saving…' : `Save All ${quests.length}`}
              </button>
            )}
          </div>

          {quests.length > 0 ? (
            <div className="space-y-6">
              {quests.map((quest, idx) => (
                <div key={idx} className={quests.length > 1 ? 'pb-6 border-b border-gray-700 last:border-0 last:pb-0' : ''}>
                  {quests.length > 1 && (
                    <p className="text-xs text-gray-500 mb-3">#{idx + 1}</p>
                  )}
                  <QuestReview
                    quest={quest}
                    onChange={(q) => setQuests((prev) => prev.map((item, i) => (i === idx ? q : item)))}
                    onSave={() => handleSave(idx)}
                    onDiscard={() => setQuests((prev) => prev.filter((_, i) => i !== idx))}
                    isSaving={savingIdx === idx || isSavingAll}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <div className="text-4xl opacity-20">✦</div>
              <p className="text-gray-500 text-sm">
                {settings.primaryVirtue
                  ? 'Click "Generate" to create quests.'
                  : 'Select a primary virtue, then generate quests.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
