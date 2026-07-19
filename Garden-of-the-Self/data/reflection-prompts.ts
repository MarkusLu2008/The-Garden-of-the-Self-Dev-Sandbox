/**
 * Rotating prompt pool for the optional post-quest reflection (Phase 9).
 * Separate from the free-form journal — these are one-line nudges for a
 * short private note right after completing a quest.
 */

export const reflectionPrompts = [
  'How did it feel?',
  'What was hardest about it?',
  'What surprised you?',
  'Where did you feel resistance — and what got you past it?',
  'What did this show you about yourself?',
  'Would you do it differently next time?',
  'What almost stopped you today?',
  'Who else was affected by what you did?',
] as const;

/**
 * Deterministic rotation: the same completion always gets the same prompt,
 * and consecutive completions walk through the pool.
 */
export function reflectionPromptFor(seed: number): string {
  const index = ((seed % reflectionPrompts.length) + reflectionPrompts.length) % reflectionPrompts.length;
  return reflectionPrompts[index];
}
