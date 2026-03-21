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

const ROOT_VIRTUE: Virtue = 'Curiosity';
const FALLBACK_DISTANCE = Number.MAX_SAFE_INTEGER;

function isVirtue(value: string): value is Virtue {
  return (VIRTUES as readonly string[]).includes(value);
}

function buildDistanceFromRoot(root: Virtue): Map<Virtue, number> {
  const adjacency = new Map<Virtue, Set<Virtue>>();
  for (const virtue of VIRTUES) {
    adjacency.set(virtue, new Set());
  }

  for (const virtue of VIRTUES) {
    const companions = COMPANION_GRAPH[virtue] ?? [];
    for (const companion of companions) {
      if (!isVirtue(companion)) continue;
      adjacency.get(virtue)?.add(companion);
      adjacency.get(companion)?.add(virtue);
    }
  }

  const distances = new Map<Virtue, number>();
  distances.set(root, 0);
  const queue: Virtue[] = [root];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const currentDistance = distances.get(current);
    if (currentDistance === undefined) continue;

    for (const neighbor of adjacency.get(current) ?? []) {
      if (distances.has(neighbor)) continue;
      distances.set(neighbor, currentDistance + 1);
      queue.push(neighbor);
    }
  }

  return distances;
}

const DISTANCE_FROM_CURIOSITY = buildDistanceFromRoot(ROOT_VIRTUE);

export function getVirtueDistanceFromCuriosity(virtue: string): number {
  if (!isVirtue(virtue)) return FALLBACK_DISTANCE;
  return DISTANCE_FROM_CURIOSITY.get(virtue) ?? FALLBACK_DISTANCE;
}
