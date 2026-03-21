'use client';

import { useState } from 'react';
import Link from 'next/link';
import SettingsPanel from '@/components/SettingsPanel';
import QuestReview from '@/components/QuestReview';
import type { QuestSeedItem, GenerateSettings } from '@/lib/questTypes';

const DEFAULT_SETTINGS: GenerateSettings = {
  primaryVirtue: '',
  secondaryVirtues: [],
  duration: 'Medium',
};

type Message = { text: string; type: 'success' | 'error' };

export default function Home() {
  const [settings, setSettings] = useState<GenerateSettings>(DEFAULT_SETTINGS);
  const [quest, setQuest] = useState<QuestSeedItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAutoSuggest, setIsLoadingAutoSuggest] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const showMessage = (text: string, type: Message['type']) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

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
      const generated: QuestSeedItem = await res.json();
      setQuest(generated);
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
      const suggestion: GenerateSettings = await res.json();
      setSettings(suggestion);
    } catch {
      showMessage('Auto-suggest failed', 'error');
    } finally {
      setIsLoadingAutoSuggest(false);
    }
  };

  const handleSave = async () => {
    if (!quest) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quest),
      });
      if (!res.ok) throw new Error('Save failed');
      const { total } = await res.json();
      showMessage(`Quest saved! Library now has ${total} quest${total === 1 ? '' : 's'}.`, 'success');
      setQuest(null);
    } catch {
      showMessage('Failed to save quest', 'error');
    } finally {
      setIsSaving(false);
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

      <main className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <section className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-5 flex items-center gap-2">
            Settings
            {settings.primaryVirtue && (
              <span className="text-xs font-normal text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-full">
                {settings.primaryVirtue}
                {settings.secondaryVirtues.length > 0 &&
                  ` + ${settings.secondaryVirtues.join(', ')}`}
                {' · '}
                {settings.duration}
              </span>
            )}
          </h2>
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            onGenerate={handleGenerate}
            onAutoSuggest={handleAutoSuggest}
            isGenerating={isGenerating}
            isLoadingAutoSuggest={isLoadingAutoSuggest}
          />
        </section>

        <section className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-5">
            {quest ? 'Review & Edit' : 'Generated Quest'}
          </h2>
          {quest ? (
            <QuestReview
              quest={quest}
              onChange={setQuest}
              onSave={handleSave}
              onDiscard={() => setQuest(null)}
              isSaving={isSaving}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <div className="text-4xl opacity-20">✦</div>
              <p className="text-gray-500 text-sm">
                {settings.primaryVirtue
                  ? 'Click "Generate Quest" to create a quest.'
                  : 'Select a primary virtue, then generate a quest.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
