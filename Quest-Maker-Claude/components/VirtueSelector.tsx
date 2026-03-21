'use client';

import { VIRTUES, COMPANION_GRAPH } from '@/lib/virtues';

interface Props {
  mode: 'primary' | 'secondary';
  selected: string[];
  primaryVirtue: string | null;
  onChange: (virtues: string[]) => void;
}

export default function VirtueSelector({ mode, selected, primaryVirtue, onChange }: Props) {
  const validCompanions = primaryVirtue ? (COMPANION_GRAPH[primaryVirtue] ?? []) : [];

  const handleClick = (virtue: string) => {
    if (mode === 'primary') {
      onChange([virtue]);
    } else {
      onChange(
        selected.includes(virtue)
          ? selected.filter((v) => v !== virtue)
          : [...selected, virtue]
      );
    }
  };

  const virtues = mode === 'secondary' ? VIRTUES.filter((v) => v !== primaryVirtue) : VIRTUES;

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {virtues.map((virtue) => {
        const isSelected = selected.includes(virtue);
        const isCompanion = mode === 'secondary' && validCompanions.includes(virtue);
        const hasPrimary = mode === 'secondary' && !!primaryVirtue;

        let className =
          'px-2.5 py-1.5 rounded text-xs text-left transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 ';

        if (isSelected) {
          className += 'bg-emerald-600 text-white font-medium';
        } else if (isCompanion) {
          className += 'bg-gray-700 text-gray-100 ring-1 ring-emerald-600/60 hover:bg-gray-600';
        } else if (hasPrimary && !isCompanion) {
          className += 'bg-gray-800 text-gray-500 hover:bg-gray-700';
        } else {
          className += 'bg-gray-700 text-gray-200 hover:bg-gray-600';
        }

        return (
          <button key={virtue} onClick={() => handleClick(virtue)} className={className}>
            <span className="flex items-center gap-1">
              {virtue}
              {isCompanion && !isSelected && (
                <span className="text-emerald-500 text-[10px] leading-none">●</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
