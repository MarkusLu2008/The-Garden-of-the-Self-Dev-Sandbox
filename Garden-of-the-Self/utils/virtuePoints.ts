import type { JournalVirtueValues } from '@/services/db';
import { gameConfig } from '@/constants/gameConfig';

export function distributeJournalVirtuePoints(
  selectedVirtues: string[],
  totalPoints = gameConfig.journal.totalPointsPerEntry
): JournalVirtueValues {
  const result: JournalVirtueValues = {};
  const n = selectedVirtues.length;

  if (n === 0 || totalPoints <= 0) {
    return result;
  }

  const base = Math.floor(totalPoints / n);
  let remainder = totalPoints % n;

  selectedVirtues.forEach((name) => {
    let value = base;
    if (remainder > 0) {
      value += 1;
      remainder -= 1;
    }
    if (value > 0) {
      result[name] = value;
    }
  });

  return result;
}

