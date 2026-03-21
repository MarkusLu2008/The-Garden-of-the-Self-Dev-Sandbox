'use client';

import { useState } from 'react';
import type { QuestSeedItem, QuestDuration } from '@/lib/questTypes';
import { VIRTUES } from '@/lib/virtues';

interface Props {
  quest: QuestSeedItem;
  onChange: (q: QuestSeedItem) => void;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
}

const DURATIONS: QuestDuration[] = ['Short', 'Medium', 'Long'];

export default function QuestReview({ quest, onChange, onSave, onDiscard, isSaving }: Props) {
  const [addingVirtue, setAddingVirtue] = useState(false);

  const sortedVirtues = Object.entries(quest.virtues).sort(([, a], [, b]) => b - a);
  const usedVirtues = new Set(Object.keys(quest.virtues));
  const availableToAdd = VIRTUES.filter((v) => !usedVirtues.has(v));

  const updateScore = (key: string, value: number) => {
    onChange({ ...quest, virtues: { ...quest.virtues, [key]: value } });
  };

  const renameVirtue = (oldKey: string, newKey: string) => {
    const entries = Object.entries(quest.virtues);
    const updated: Record<string, number> = {};
    for (const [k, v] of entries) {
      updated[k === oldKey ? newKey : k] = v;
    }
    onChange({ ...quest, virtues: updated });
  };

  const removeVirtue = (key: string) => {
    const { [key]: _, ...rest } = quest.virtues;
    onChange({ ...quest, virtues: rest });
  };

  const addVirtue = (virtue: string) => {
    onChange({ ...quest, virtues: { ...quest.virtues, [virtue]: 1 } });
    setAddingVirtue(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2">
          Prompt
        </label>
        <textarea
          value={quest.prompt}
          onChange={(e) => onChange({ ...quest, prompt: e.target.value })}
          rows={5}
          className="w-full bg-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2">
          Virtues &amp; Points
        </label>
        <div className="space-y-2">
          {sortedVirtues.map(([virtue, score]) => (
            <div key={virtue} className="flex items-center gap-2">
              <select
                value={virtue}
                onChange={(e) => renameVirtue(virtue, e.target.value)}
                className="flex-1 bg-gray-700 text-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={virtue}>{virtue}</option>
                {availableToAdd.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={20}
                value={score}
                onChange={(e) => updateScore(virtue, parseInt(e.target.value) || 1)}
                className="w-16 bg-gray-700 text-gray-100 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={() => removeVirtue(virtue)}
                className="text-gray-500 hover:text-red-400 transition-colors px-1 text-lg leading-none"
                title="Remove virtue"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {addingVirtue ? (
          <select
            autoFocus
            defaultValue=""
            onChange={(e) => e.target.value && addVirtue(e.target.value)}
            onBlur={() => setAddingVirtue(false)}
            className="mt-2 w-full bg-gray-700 text-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select virtue to add…</option>
            {availableToAdd.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        ) : availableToAdd.length > 0 ? (
          <button
            onClick={() => setAddingVirtue(true)}
            className="mt-2 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            + Add virtue
          </button>
        ) : null}
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2">
          Duration
        </label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => onChange({ ...quest, duration: d })}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                quest.duration === d
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-700">
        <button
          onClick={onDiscard}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={isSaving || !quest.prompt.trim() || Object.keys(quest.virtues).length === 0}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving…' : 'Save Quest'}
        </button>
      </div>
    </div>
  );
}
