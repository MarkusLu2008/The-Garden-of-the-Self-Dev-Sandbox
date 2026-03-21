'use client';

import { VIRTUES, COMPANION_GRAPH } from '@/lib/virtues';

interface Props {
  mode: 'primary' | 'secondary';
  selected: string[];
  primaryVirtue: string | null;
  onChange: (virtues: string[]) => void;
}

// Build deduplicated undirected edge list from COMPANION_GRAPH
const EDGES: [string, string][] = (() => {
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const [v, neighbors] of Object.entries(COMPANION_GRAPH)) {
    for (const n of neighbors) {
      const key = [v, n].sort().join('|');
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([v, n]);
      }
    }
  }
  return edges;
})();

const W = 520;
const H = 460;

// Force-directed layout computed once at module load (deterministic)
function computeLayout(): Record<string, { x: number; y: number }> {
  const PAD = 65;
  const pos: Record<string, { x: number; y: number; vx: number; vy: number }> = {};

  VIRTUES.forEach((v, i) => {
    const angle = (2 * Math.PI * i) / VIRTUES.length - Math.PI / 2;
    pos[v] = {
      x: W / 2 + (W / 2 - PAD) * 0.75 * Math.cos(angle),
      y: H / 2 + (H / 2 - PAD) * 0.75 * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  const IDEAL = 115;
  const SPRING = 0.04;
  const REPEL = 11000;
  const DAMP = 0.8;

  for (let iter = 0; iter < 600; iter++) {
    const f: Record<string, { fx: number; fy: number }> = {};
    for (const v of VIRTUES) f[v] = { fx: 0, fy: 0 };

    // Spring forces along edges
    for (const [a, b] of EDGES) {
      const dx = pos[b].x - pos[a].x;
      const dy = pos[b].y - pos[a].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const mag = SPRING * (d - IDEAL);
      f[a].fx += (dx / d) * mag;
      f[a].fy += (dy / d) * mag;
      f[b].fx -= (dx / d) * mag;
      f[b].fy -= (dy / d) * mag;
    }

    // Coulomb repulsion between all pairs
    for (let i = 0; i < VIRTUES.length; i++) {
      for (let j = i + 1; j < VIRTUES.length; j++) {
        const a = VIRTUES[i];
        const b = VIRTUES[j];
        const dx = pos[b].x - pos[a].x;
        const dy = pos[b].y - pos[a].y;
        const d2 = Math.max(dx * dx + dy * dy, 1);
        const d = Math.sqrt(d2);
        const mag = REPEL / d2;
        f[a].fx -= (dx / d) * mag;
        f[a].fy -= (dy / d) * mag;
        f[b].fx += (dx / d) * mag;
        f[b].fy += (dy / d) * mag;
      }
    }

    // Weak gravity toward center
    for (const v of VIRTUES) {
      f[v].fx += (W / 2 - pos[v].x) * 0.01;
      f[v].fy += (H / 2 - pos[v].y) * 0.01;
    }

    // Integrate with damping + boundary clamping
    for (const v of VIRTUES) {
      pos[v].vx = (pos[v].vx + f[v].fx) * DAMP;
      pos[v].vy = (pos[v].vy + f[v].fy) * DAMP;
      pos[v].x = Math.max(PAD, Math.min(W - PAD, pos[v].x + pos[v].vx));
      pos[v].y = Math.max(PAD, Math.min(H - PAD, pos[v].y + pos[v].vy));
    }
  }

  const result: Record<string, { x: number; y: number }> = {};
  for (const v of VIRTUES) result[v] = { x: pos[v].x, y: pos[v].y };
  return result;
}

const LAYOUT = computeLayout();

// Approximate pill dimensions based on character count at font-size 9
function nodeDims(virtue: string): { w: number; h: number; lines: string[] } {
  const words = virtue.split(' ');
  const CW = 5.8; // approx char width at font-size 9
  const PX = 18;
  if (words.length === 1) {
    return { w: Math.max(58, virtue.length * CW + PX), h: 22, lines: words };
  }
  const maxLen = Math.max(...words.map((w) => w.length));
  return { w: Math.max(58, maxLen * CW + PX), h: 32, lines: words };
}

export default function VirtueGraphSelector({ mode, selected, primaryVirtue, onChange }: Props) {
  const validCompanions = primaryVirtue ? (COMPANION_GRAPH[primaryVirtue] ?? []) : [];

  const handleClick = (virtue: string) => {
    if (mode === 'secondary' && virtue === primaryVirtue) return;
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

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ maxHeight: `${H}px` }}
    >
      {/* Edges — drawn first so nodes render on top */}
      {EDGES.map(([a, b]) => {
        const pA = LAYOUT[a];
        const pB = LAYOUT[b];
        const isPrimaryEdge =
          mode === 'secondary' &&
          !!primaryVirtue &&
          (a === primaryVirtue || b === primaryVirtue);
        return (
          <line
            key={`${a}|${b}`}
            x1={pA.x}
            y1={pA.y}
            x2={pB.x}
            y2={pB.y}
            stroke={isPrimaryEdge ? '#059669' : '#374151'}
            strokeWidth={isPrimaryEdge ? 1.5 : 1}
            strokeOpacity={isPrimaryEdge ? 0.8 : 0.5}
          />
        );
      })}

      {/* Nodes */}
      {VIRTUES.map((virtue) => {
        const p = LAYOUT[virtue];
        const { w: nw, h: nh, lines } = nodeDims(virtue);

        // In secondary mode the primary virtue is shown as an anchor node (not selectable)
        const isPrimary = mode === 'secondary' && virtue === primaryVirtue;
        const isSelected = selected.includes(virtue);
        const isCompanion = mode === 'secondary' && validCompanions.includes(virtue);
        const hasPrimary = mode === 'secondary' && !!primaryVirtue;
        const isDimmed = hasPrimary && !isCompanion && !isSelected && !isPrimary;

        let fill: string;
        let textFill: string;
        let stroke: string | undefined;

        if (isPrimary) {
          fill = '#064e3b'; // emerald-900
          textFill = '#6ee7b7'; // emerald-300
          stroke = '#059669'; // emerald-600
        } else if (isSelected) {
          fill = '#059669'; // emerald-600
          textFill = '#ffffff';
        } else if (isCompanion) {
          fill = '#374151'; // gray-700
          textFill = '#f3f4f6'; // gray-100
          stroke = '#059669'; // emerald-600
        } else if (isDimmed) {
          fill = '#1f2937'; // gray-800
          textFill = '#4b5563'; // gray-600
        } else {
          fill = '#374151'; // gray-700
          textFill = '#e5e7eb'; // gray-200
        }

        return (
          <g
            key={virtue}
            onClick={() => handleClick(virtue)}
            className={isPrimary ? 'cursor-default' : 'cursor-pointer transition-opacity hover:opacity-80'}
          >
            <rect
              x={p.x - nw / 2}
              y={p.y - nh / 2}
              width={nw}
              height={nh}
              rx={4}
              fill={fill}
              stroke={stroke ?? 'transparent'}
              strokeWidth={stroke ? 1.5 : 0}
            />
            {/* Single-line label */}
            {lines.length === 1 && (
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill={textFill}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {lines[0]}
              </text>
            )}
            {/* Two-line label (e.g. "Proper Ambition") */}
            {lines.length === 2 && (
              <text
                x={p.x}
                y={p.y - 5.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill={textFill}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {lines[0]}
                <tspan x={p.x} dy="11">{lines[1]}</tspan>
              </text>
            )}
            {/* Companion indicator dot */}
            {isCompanion && !isSelected && (
              <circle
                cx={p.x + nw / 2 - 4}
                cy={p.y - nh / 2 + 4}
                r={2.5}
                fill="#10b981"
                style={{ pointerEvents: 'none' }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
