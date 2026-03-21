import { describe, expect, it } from 'vitest';
import {
  normalizeQuestAgainstDominant,
  validateQuestAgainstDominant,
} from '@/lib/virtue-compatibility';

describe('virtue compatibility rules', () => {
  it('drops incompatible companion virtues and keeps dominant virtue', () => {
    const result = normalizeQuestAgainstDominant(
      {
        prompt: 'Practice mindful learning for 20 minutes and journal one insight.',
        duration: 'Medium',
        virtues: {
          Curiosity: 5,
          Temperance: 3,
        },
      },
      'Curiosity',
    );

    expect(result.quest.virtues.Curiosity).toBeGreaterThan(0);
    expect(result.quest.virtues.Temperance).toBeUndefined();
    expect(result.diagnostics.some((line) => line.includes('Dropped incompatible virtue'))).toBe(true);
  });

  it('returns validation errors for incompatible virtues', () => {
    const errors = validateQuestAgainstDominant(
      {
        prompt: 'Do a deliberate challenge with emotional control.',
        duration: 'Short',
        virtues: {
          Courage: 4,
          Temperance: 2,
        },
      },
      'Courage',
    );

    expect(errors.some((error) => error.includes('not compatible'))).toBe(true);
  });
});
