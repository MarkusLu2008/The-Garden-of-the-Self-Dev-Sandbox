'use client';

import type { GenerateSettings, QuestDuration } from '@/lib/questTypes';
import VirtueSelector from './VirtueSelector';

interface Props {
  settings: GenerateSettings;
  onChange: (s: GenerateSettings) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function SettingsPanel({ settings, onChange, onGenerate, isGenerating }: Props) {
  const durations: QuestDuration[] = ['Short', 'Medium', 'Long'];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Primary virtue</p>
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
        <p className="text-xs text-gray-500 mb-1.5">
          Secondary virtues
          {settings.primaryVirtue && (
            <span className="ml-1 text-emerald-600/80">· ● valid companion</span>
          )}
        </p>
        <VirtueSelector
          mode="secondary"
          selected={settings.secondaryVirtues}
          primaryVirtue={settings.primaryVirtue || null}
          onChange={(v) => onChange({ ...settings, secondaryVirtues: v })}
        />
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-500 w-14 shrink-0">Duration</p>
        <div className="flex gap-1.5">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => onChange({ ...settings, duration: d })}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                settings.duration === d
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-500 w-14 shrink-0">Count</p>
        <input
          type="range"
          min={1}
          max={20}
          value={settings.count}
          onChange={(e) => onChange({ ...settings, count: parseInt(e.target.value) })}
          className="flex-1 accent-emerald-500 cursor-pointer"
        />
        <input
          type="number"
          min={1}
          max={20}
          value={settings.count}
          onChange={(e) => {
            const n = parseInt(e.target.value);
            if (!isNaN(n) && n >= 1) onChange({ ...settings, count: Math.min(n, 20) });
          }}
          className="w-12 bg-gray-700 text-gray-100 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={!settings.primaryVirtue || isGenerating}
        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating
          ? 'Generating…'
          : settings.count === 1
          ? 'Generate Quest'
          : `Generate ${settings.count} Quests`}
      </button>
    </div>
  );
}
