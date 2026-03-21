import { describe, expect, it } from 'vitest';
import { buildQuestSeedSnippet, mergeQuestsIntoSeed } from '@/lib/seed-file-writer';
import type { QuestSeedItem } from '@/lib/seed-types';

describe('seed file serializer and merger', () => {
  it('formats quest items into seed snippet', () => {
    const quests: QuestSeedItem[] = [
      {
        prompt: 'Spend 15 minutes helping someone without being asked.',
        virtues: { Kindness: 6, Empathy: 2 },
        duration: 'Short',
      },
    ];
    const snippet = buildQuestSeedSnippet(quests);
    expect(snippet).toContain('prompt: "Spend 15 minutes helping someone without being asked."');
    expect(snippet).toContain('"Kindness": 6');
    expect(snippet).toContain('duration: "Short"');
  });

  it('adds non-duplicate quests and skips duplicate prompts', () => {
    const source = [
      'export const questsSeed: QuestSeedItem[] = [',
      '  {',
      '    prompt: "Existing prompt",',
      '    virtues: { "Curiosity": 6 },',
      '    duration: "Long",',
      '  },',
      '];',
      '',
    ].join('\n');

    const incoming: QuestSeedItem[] = [
      {
        prompt: 'Existing prompt',
        virtues: { Curiosity: 7 },
        duration: 'Short',
      },
      {
        prompt: 'New prompt',
        virtues: { Courage: 4 },
        duration: 'Medium',
      },
    ];

    const merge = mergeQuestsIntoSeed(source, incoming);
    expect(merge.added).toHaveLength(1);
    expect(merge.skipped).toHaveLength(1);
    expect(merge.nextContent).toContain('prompt: "New prompt"');
  });
});
