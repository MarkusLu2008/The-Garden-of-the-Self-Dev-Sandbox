'use client';

import { useMemo, useState } from 'react';
import type { BatchDiagnostics, GeneratedQuestResponse } from '@/lib/api-types';
import {
  DOMINANT_COMPANION_MAP,
  validateQuestAgainstDominant,
} from '@/lib/virtue-compatibility';
import {
  QUEST_DURATIONS,
  VIRTUE_LIST,
  type QuestDuration,
  type QuestSeedItem,
  type VirtueName,
} from '@/lib/seed-types';

type EditableVirtue = {
  id: string;
  virtue: string;
  value: number;
};

type EditableQuest = {
  id: string;
  prompt: string;
  duration: QuestDuration;
  virtues: EditableVirtue[];
  diagnostics: string[];
  approved: boolean;
};

type SeedExportResponse = {
  snippet: string;
  count: number;
};

type SeedWriteResponse = {
  dryRun: boolean;
  seedFilePath: string;
  addedCount: number;
  skippedCount: number;
  diffPreview: string;
};

const VIRTUE_OPTIONS = [...VIRTUE_LIST];

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function toEditableQuest(input: GeneratedQuestResponse): EditableQuest {
  return {
    id: makeId('quest'),
    prompt: input.quest.prompt,
    duration: input.quest.duration,
    virtues: Object.entries(input.quest.virtues).map(([virtue, value]) => ({
      id: makeId('virtue'),
      virtue,
      value,
    })),
    diagnostics: input.diagnostics,
    approved: false,
  };
}

function toQuestSeedItem(quest: EditableQuest): QuestSeedItem {
  const virtues: Record<string, number> = {};
  for (const virtueRow of quest.virtues) {
    if (!virtueRow.virtue) continue;
    virtues[virtueRow.virtue] = Number(virtueRow.value);
  }
  return {
    prompt: quest.prompt,
    duration: quest.duration,
    virtues,
  };
}

export default function HomePage() {
  const [dominantVirtue, setDominantVirtue] = useState<VirtueName>('Curiosity');
  const [companionVirtues, setCompanionVirtues] = useState<string[]>([]);
  const [duration, setDuration] = useState<QuestDuration>('Medium');
  const [count, setCount] = useState(5);
  const [model, setModel] = useState('gpt-4.1-mini');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quests, setQuests] = useState<EditableQuest[]>([]);
  const [batchDiagnostics, setBatchDiagnostics] = useState<BatchDiagnostics | null>(null);
  const [snippet, setSnippet] = useState<string>('');
  const [seedWriteResult, setSeedWriteResult] = useState<SeedWriteResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const allowedCompanions = useMemo(
    () => DOMINANT_COMPANION_MAP[dominantVirtue] ?? [],
    [dominantVirtue],
  );

  const questErrorsById = useMemo(() => {
    const table: Record<string, string[]> = {};
    for (const quest of quests) {
      table[quest.id] = validateQuestAgainstDominant(toQuestSeedItem(quest), dominantVirtue);
    }
    return table;
  }, [quests, dominantVirtue]);

  const approvedValidQuests = useMemo(
    () =>
      quests
        .filter((quest) => quest.approved)
        .filter((quest) => (questErrorsById[quest.id] ?? []).length === 0)
        .map(toQuestSeedItem),
    [quests, questErrorsById],
  );

  async function generateQuests() {
    setError(null);
    setSnippet('');
    setSeedWriteResult(null);
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dominantVirtue,
          companionVirtues,
          duration,
          count,
          model,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to generate quests.');
      }

      const generated = (data.generated as GeneratedQuestResponse[]).map(toEditableQuest);
      setBatchDiagnostics(data.batchDiagnostics as BatchDiagnostics);
      setQuests(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quests.');
    } finally {
      setIsGenerating(false);
    }
  }

  function updateQuest(id: string, updater: (quest: EditableQuest) => EditableQuest) {
    setQuests((current) => current.map((quest) => (quest.id === id ? updater(quest) : quest)));
  }

  function toggleCompanion(virtue: string) {
    setCompanionVirtues((current) =>
      current.includes(virtue) ? current.filter((value) => value !== virtue) : [...current, virtue],
    );
  }

  function setDominant(nextDominant: VirtueName) {
    setDominantVirtue(nextDominant);
    const nextAllowed = new Set(DOMINANT_COMPANION_MAP[nextDominant] ?? []);
    setCompanionVirtues((current) => current.filter((virtue) => nextAllowed.has(virtue as VirtueName)));
  }

  function approveAllValid() {
    setQuests((current) =>
      current.map((quest) => ({
        ...quest,
        approved: (questErrorsById[quest.id] ?? []).length === 0,
      })),
    );
  }

  async function exportApproved() {
    setError(null);
    setSeedWriteResult(null);
    const response = await fetch('/api/seed/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dominantVirtue,
        quests: approvedValidQuests,
      }),
    });
    const data = (await response.json()) as SeedExportResponse & { error?: string };
    if (!response.ok) {
      setError(data.error ?? 'Failed to export snippet.');
      return;
    }
    setSnippet(data.snippet);
  }

  async function writeApproved(apply: boolean) {
    setError(null);
    setSnippet('');
    setIsSaving(true);
    try {
      const response = await fetch('/api/seed/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dominantVirtue,
          quests: approvedValidQuests,
          apply,
        }),
      });
      const data = (await response.json()) as SeedWriteResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to write seed file.');
      }
      setSeedWriteResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to write seed file.');
    } finally {
      setIsSaving(false);
    }
  }

  async function copySnippet() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
  }

  return (
    <main>
      <h1>Quest-Maker AI Quest Seed Workflow</h1>
      <p>
        Generate virtue-compatible quests, review/edit them, approve valid entries, then export or
        write into <code>quests-seed.ts</code>.
      </p>

      <section className="panel">
        <h2>Generation Controls</h2>
        <div className="row">
          <div className="stack">
            <label>Dominant Virtue</label>
            <select
              value={dominantVirtue}
              onChange={(event) => setDominant(event.target.value as VirtueName)}
            >
              {VIRTUE_OPTIONS.map((virtue) => (
                <option key={virtue} value={virtue}>
                  {virtue}
                </option>
              ))}
            </select>
          </div>
          <div className="stack">
            <label>Duration</label>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value as QuestDuration)}
            >
              {QUEST_DURATIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="stack">
            <label>Quest Count</label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(event) => setCount(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
            />
          </div>
          <div className="stack">
            <label>OpenAI Model</label>
            <input value={model} onChange={(event) => setModel(event.target.value)} />
          </div>
        </div>

        <div className="stack">
          <label>Companion Virtues (compatible only)</label>
          <div className="row">
            {allowedCompanions.map((virtue) => (
              <label key={virtue} className="pill">
                <input
                  type="checkbox"
                  checked={companionVirtues.includes(virtue)}
                  onChange={() => toggleCompanion(virtue)}
                />{' '}
                {virtue}
              </label>
            ))}
          </div>
        </div>

        <button className="button" onClick={generateQuests} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Quests'}
        </button>
        {batchDiagnostics && (
          <div style={{ marginTop: '0.75rem' }}>
            <div className="pill">
              Allowed companions: {batchDiagnostics.allowedCompanions.join(', ') || 'None'}
            </div>
            {batchDiagnostics.warningMessages.map((message) => (
              <p key={message} className="error">
                {message}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Review and Approval Queue</h2>
        <p>
          Approved and valid quests: <strong>{approvedValidQuests.length}</strong> / {quests.length}
        </p>
        <div className="row">
          <button className="button secondary" onClick={approveAllValid} disabled={quests.length === 0}>
            Approve All Valid
          </button>
          <button className="button danger" onClick={() => setQuests([])} disabled={quests.length === 0}>
            Clear Queue
          </button>
        </div>

        {quests.map((quest, questIndex) => {
          const questErrors = questErrorsById[quest.id] ?? [];
          const isValid = questErrors.length === 0;
          return (
            <div key={quest.id} className="quest-card">
              <h3>Quest #{questIndex + 1}</h3>
              <p className={isValid ? 'ok' : 'error'}>
                {isValid ? 'Valid for seed' : `${questErrors.length} validation issue(s)`}
              </p>
              {!!quest.diagnostics.length && (
                <details>
                  <summary>AI normalization diagnostics ({quest.diagnostics.length})</summary>
                  <ul>
                    {quest.diagnostics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="stack">
                <label>Prompt</label>
                <textarea
                  value={quest.prompt}
                  onChange={(event) =>
                    updateQuest(quest.id, (current) => ({ ...current, prompt: event.target.value }))
                  }
                />
              </div>

              <div className="stack">
                <label>Duration</label>
                <select
                  value={quest.duration}
                  onChange={(event) =>
                    updateQuest(quest.id, (current) => ({
                      ...current,
                      duration: event.target.value as QuestDuration,
                    }))
                  }
                >
                  {QUEST_DURATIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="stack">
                <label>Virtues</label>
                {quest.virtues.map((virtueRow) => (
                  <div className="row" key={virtueRow.id}>
                    <select
                      value={virtueRow.virtue}
                      onChange={(event) =>
                        updateQuest(quest.id, (current) => ({
                          ...current,
                          virtues: current.virtues.map((row) =>
                            row.id === virtueRow.id ? { ...row, virtue: event.target.value } : row,
                          ),
                        }))
                      }
                    >
                      {VIRTUE_OPTIONS.map((virtue) => (
                        <option key={virtue} value={virtue}>
                          {virtue}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={virtueRow.value}
                      onChange={(event) =>
                        updateQuest(quest.id, (current) => ({
                          ...current,
                          virtues: current.virtues.map((row) =>
                            row.id === virtueRow.id
                              ? { ...row, value: Math.max(1, Number(event.target.value) || 1) }
                              : row,
                          ),
                        }))
                      }
                    />
                    <button
                      className="button secondary"
                      onClick={() =>
                        updateQuest(quest.id, (current) => ({
                          ...current,
                          virtues: current.virtues.filter((row) => row.id !== virtueRow.id),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  className="button secondary"
                  onClick={() =>
                    updateQuest(quest.id, (current) => ({
                      ...current,
                      virtues: [
                        ...current.virtues,
                        {
                          id: makeId('virtue'),
                          virtue: dominantVirtue,
                          value: 1,
                        },
                      ],
                    }))
                  }
                >
                  Add Virtue
                </button>
              </div>

              {!isValid && (
                <ul className="error">
                  {questErrors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}

              <label className="pill">
                <input
                  type="checkbox"
                  checked={quest.approved}
                  disabled={!isValid}
                  onChange={() =>
                    updateQuest(quest.id, (current) => ({
                      ...current,
                      approved: !current.approved,
                    }))
                  }
                />{' '}
                Approved
              </label>
            </div>
          );
        })}
      </section>

      <section className="panel">
        <h2>Output Modes</h2>
        <div className="row">
          <button className="button" disabled={approvedValidQuests.length === 0} onClick={exportApproved}>
            Export Snippet
          </button>
          <button
            className="button secondary"
            disabled={approvedValidQuests.length === 0 || isSaving}
            onClick={() => writeApproved(false)}
          >
            Preview Direct Write (Dry Run)
          </button>
          <button
            className="button danger"
            disabled={approvedValidQuests.length === 0 || isSaving}
            onClick={() => writeApproved(true)}
          >
            Apply Direct Write
          </button>
        </div>

        {snippet && (
          <div className="stack">
            <label>Exported QuestSeedItem snippet</label>
            <textarea readOnly value={snippet} style={{ minHeight: 220 }} />
            <button className="button secondary" onClick={copySnippet}>
              Copy Snippet
            </button>
          </div>
        )}

        {seedWriteResult && (
          <div className="stack">
            <p>
              <strong>{seedWriteResult.dryRun ? 'Dry Run' : 'Write Applied'}</strong> — Added:{' '}
              {seedWriteResult.addedCount}, Skipped duplicates: {seedWriteResult.skippedCount}
            </p>
            <p>
              Target file: <code>{seedWriteResult.seedFilePath}</code>
            </p>
            <label>Diff Preview</label>
            <textarea readOnly value={seedWriteResult.diffPreview} style={{ minHeight: 220 }} />
          </div>
        )}
      </section>

      {error && (
        <section className="panel">
          <p className="error">{error}</p>
        </section>
      )}
    </main>
  );
}
