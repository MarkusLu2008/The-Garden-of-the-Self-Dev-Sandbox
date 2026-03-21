export const VIRTUES = [
  'Courage',
  'Temperance',
  'Patience',
  'Kindness',
  'Proper Ambition',
  'Modesty',
  'Empathy',
  'Resilience',
  'Curiosity',
  'Respectfulness',
  'Tolerance',
  'Collaboration',
  'Discipline',
] as const;

export type Virtue = (typeof VIRTUES)[number];

// From planning/quest-virtue-combinations.md
export const COMPANION_GRAPH: Record<string, string[]> = {
  Curiosity: ['Courage', 'Proper Ambition'],
  Courage: ['Curiosity', 'Proper Ambition'],
  'Proper Ambition': ['Modesty', 'Kindness', 'Discipline', 'Courage', 'Curiosity'],
  Kindness: ['Proper Ambition', 'Patience', 'Modesty', 'Collaboration', 'Empathy'],
  Modesty: ['Proper Ambition', 'Kindness', 'Respectfulness'],
  Discipline: ['Proper Ambition', 'Patience', 'Temperance', 'Resilience'],
  Resilience: ['Discipline', 'Temperance'],
  Patience: ['Kindness', 'Discipline', 'Tolerance'],
  Temperance: ['Discipline', 'Resilience', 'Tolerance'],
  Empathy: ['Collaboration', 'Tolerance', 'Kindness'],
  Collaboration: ['Empathy', 'Kindness'],
  Tolerance: ['Patience', 'Temperance', 'Respectfulness'],
  Respectfulness: ['Tolerance', 'Modesty'],
};
