import virtues from '@/constants/virtues';
import {
  VIRTUE_SEED_UNLOCK_PRICING,
  type VirtueSeedUnlockPricingConfig,
} from '@/constants/virtueSeedUnlockPricing';

type GraphEdge = [string, string];

const UNDIRECTED_VIRTUE_EDGES: GraphEdge[] = [
  ['Curiosity', 'Courage'],
  ['Curiosity', 'Proper Ambition'],
  ['Courage', 'Proper Ambition'],
  ['Proper Ambition', 'Modesty'],
  ['Proper Ambition', 'Kindness'],
  ['Proper Ambition', 'Discipline'],
  ['Kindness', 'Patience'],
  ['Kindness', 'Modesty'],
  ['Kindness', 'Collaboration'],
  ['Kindness', 'Empathy'],
  ['Modesty', 'Respectfulness'],
  ['Discipline', 'Patience'],
  ['Discipline', 'Temperance'],
  ['Discipline', 'Resilience'],
  ['Resilience', 'Temperance'],
  ['Patience', 'Tolerance'],
  ['Temperance', 'Tolerance'],
  ['Empathy', 'Collaboration'],
  ['Empathy', 'Tolerance'],
  ['Tolerance', 'Respectfulness'],
];

const virtueSortOrder = new Map(virtues.map((name, index) => [name, index]));

function buildVirtueAdjacencyList(edges: GraphEdge[]): Record<string, string[]> {
  const adjacency: Record<string, string[]> = {};
  for (const virtue of virtues) {
    adjacency[virtue] = [];
  }
  for (const [a, b] of edges) {
    if (!adjacency[a]) adjacency[a] = [];
    if (!adjacency[b]) adjacency[b] = [];
    adjacency[a].push(b);
    adjacency[b].push(a);
  }
  for (const virtue of Object.keys(adjacency)) {
    adjacency[virtue] = [...new Set(adjacency[virtue])].sort((left, right) => {
      const leftIndex = virtueSortOrder.get(left) ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = virtueSortOrder.get(right) ?? Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    });
  }
  return adjacency;
}

const virtueAdjacency = buildVirtueAdjacencyList(UNDIRECTED_VIRTUE_EDGES);

export type ClosestUnlockedVirtueResult = {
  closestUnlockedVirtue: string | null;
  distance: number | null;
};

export function getClosestUnlockedVirtueAndDistance(
  targetVirtue: string,
  unlockedVirtues: Set<string>
): ClosestUnlockedVirtueResult {
  if (unlockedVirtues.has(targetVirtue)) {
    return {
      closestUnlockedVirtue: targetVirtue,
      distance: 0,
    };
  }

  const queue: Array<{ virtue: string; distance: number }> = [{ virtue: targetVirtue, distance: 0 }];
  const visited = new Set<string>([targetVirtue]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const neighbors = virtueAdjacency[current.virtue] ?? [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;

      const nextDistance = current.distance + 1;
      if (unlockedVirtues.has(neighbor)) {
        return {
          closestUnlockedVirtue: neighbor,
          distance: nextDistance,
        };
      }

      visited.add(neighbor);
      queue.push({ virtue: neighbor, distance: nextDistance });
    }
  }

  return {
    closestUnlockedVirtue: null,
    distance: null,
  };
}

export function getUnlockPriceFromDistance(
  distance: number,
  config: VirtueSeedUnlockPricingConfig = VIRTUE_SEED_UNLOCK_PRICING
): number {
  const rawPrice = config.basePriceDistance1 * Math.pow(config.multiplier, Math.max(0, distance - 1));
  let price = Math.round(rawPrice);
  if (config.minPrice != null) {
    price = Math.max(config.minPrice, price);
  }
  if (config.maxPrice != null) {
    price = Math.min(config.maxPrice, price);
  }
  return price;
}

export type VirtueSeedUnlockDebugRow = {
  virtueName: string;
  isUnlocked: boolean;
  closestUnlockedVirtue: string | null;
  distance: number | null;
  unlockPrice: number;
};

export function getVirtueSeedUnlockDebugRows(
  unlockedAtByVirtue: Record<string, string | null>
): VirtueSeedUnlockDebugRow[] {
  const unlockedSet = new Set(
    virtues.filter((virtueName) => unlockedAtByVirtue[virtueName] != null)
  );

  return virtues.map((virtueName) => {
    const isUnlocked = unlockedSet.has(virtueName);
    if (isUnlocked) {
      return {
        virtueName,
        isUnlocked,
        closestUnlockedVirtue: virtueName,
        distance: 0,
        unlockPrice: 0,
      };
    }

    const closest = getClosestUnlockedVirtueAndDistance(virtueName, unlockedSet);
    return {
      virtueName,
      isUnlocked,
      closestUnlockedVirtue: closest.closestUnlockedVirtue,
      distance: closest.distance,
      unlockPrice: closest.distance == null ? 0 : getUnlockPriceFromDistance(closest.distance),
    };
  });
}

