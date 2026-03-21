'use client';

import type { GenerateSettings, QuestDuration } from '@/lib/questTypes';
import VirtueSelector from './VirtueSelector';

interface Props {
  settings: GenerateSettings;
  onChange: (s: GenerateSettings) => void;
  onGenerate: () => void;
  onAutoSuggest: () => void;
  isGenerating: boolean;
  isLoadingAutoSuggest: boolean;
}

const DURATION_LABELS: Record<QuestDuration, string> = {
  Short: 'Short · Easy · 4–7 pts',
  Medium: 'Medium · 8–13 pts',
  Long: 'Long · Hard · 12–18 pts',
};

export default function SettingsPanel({
  settings,
  onChange,
  onGenerate,
  onAutoSuggest,
  isGenerating,
  isLoadingAutoSuggest,
}: Props) {
  const durations: QuestDuration[] = ['Short', 'Medium', 'Long'];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Primary Virtue
        </h3>
        <VirtueSelector
          mode="primary"
          selected={settings.primaryVirtue ? [settings.primaryVirtue] : []}
          primaryVirtue={null}
          onChange={(v) =>
            onChange({ ...settings, primaryVirtue: v[0] ?? '', secondaryVirtues: [] })
          }
        />
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
          Secondary Virtues
        </h3>
        {settings.primaryVirtue ? (
          <p className="text-[11px] text-gray-500 mb-3">
            <span className="text-emerald-500">●</span> = recommended companion for{' '}
            {settings.primaryVirtue}
          </p>
        ) : (
          <p className="text-[11px] text-gray-500 mb-3">
            Select a primary virtue first to see companion hints.
          </p>
        )}
        <VirtueSelector
          mode="secondary"
          selected={settings.secondaryVirtues}
          primaryVirtue={settings.primaryVirtue || null}
          onChange={(v) => onChange({ ...settings, secondaryVirtues: v })}
        />
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Duration / Difficulty
        </h3>
        <div className="flex flex-col gap-2">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => onChange({ ...settings, duration: d })}
              className={`px-4 py-2 rounded-lg text-sm text-left transition-colors ${
                settings.duration === d
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {DURATION_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onAutoSuggest}
          disabled={isLoadingAutoSuggest || isGenerating}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingAutoSuggest ? 'Thinking…' : '✦ Auto-suggest'}
        </button>
        <button
          onClick={onGenerate}
          disabled={!settings.primaryVirtue || isGenerating || isLoadingAutoSuggest}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating…' : 'Generate Quest'}
        </button>
      </div>
    </div>
  );
}
