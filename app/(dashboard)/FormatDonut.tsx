"use client";

import { useState } from "react";
import type { FormatSegment } from "@/lib/format-colors";

export type { FormatSegment };

type Props = { segments: FormatSegment[]; total: number };

function describeArc(cx: number, cy: number, r: number, ri: number, start: number, end: number) {
  // évite le chemin complet qui ne fonctionne pas avec largeArc=1 sur 360°
  if (Math.abs(end - start) > 2 * Math.PI - 0.001) end = start + 2 * Math.PI - 0.001;
  const large = end - start > Math.PI ? 1 : 0;
  const cos = Math.cos, sin = Math.sin;
  return [
    `M ${cx + r * cos(start)} ${cy + r * sin(start)}`,
    `A ${r} ${r} 0 ${large} 1 ${cx + r * cos(end)} ${cy + r * sin(end)}`,
    `L ${cx + ri * cos(end)} ${cy + ri * sin(end)}`,
    `A ${ri} ${ri} 0 ${large} 0 ${cx + ri * cos(start)} ${cy + ri * sin(start)}`,
    "Z",
  ].join(" ");
}

export function FormatDonut({ segments, total }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (total === 0) return (
    <p className="text-sm text-zinc-400 text-center py-8">Aucun format renseigné</p>
  );

  const cx = 80, cy = 80, r = 68, ri = 42;
  const gap = 0.025; // 1.4° de séparation entre segments
  let angle = -Math.PI / 2;

  const slices = segments.map((s) => {
    const sweep = (s.count / total) * 2 * Math.PI;
    const start = angle + gap / 2;
    const end = angle + sweep - gap / 2;
    angle += sweep;
    return { ...s, path: describeArc(cx, cy, r, ri, start, end), midAngle: (start + end) / 2 };
  });

  const hoveredSeg = slices.find((s) => s.key === hovered);

  return (
    <div className="flex items-center gap-6">
      {/* Donut SVG */}
      <div className="relative shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
          {slices.map((s) => (
            <path
              key={s.key}
              d={s.path}
              fill={s.color}
              opacity={hovered === null || hovered === s.key ? 1 : 0.35}
              className="cursor-pointer transition-opacity duration-150"
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Centre : valeur survolée ou total */}
          <text x={cx} y={cy - 7} textAnchor="middle"
            style={{ fontSize: 22, fontWeight: 700, fontFamily: "inherit", fill: "#18181b" }}>
            {hoveredSeg ? hoveredSeg.count : total}
          </text>
          <text x={cx} y={cy + 13} textAnchor="middle"
            style={{ fontSize: 11, fontFamily: "inherit", fill: "#a1a1aa" }}>
            {hoveredSeg ? hoveredSeg.label : "magasins"}
          </text>
        </svg>
      </div>

      {/* Légende */}
      <ul className="space-y-2 min-w-0">
        {slices.map((s) => (
          <li
            key={s.key}
            className={`flex items-center gap-2 cursor-default transition-opacity duration-150 ${
              hovered !== null && hovered !== s.key ? "opacity-40" : ""
            }`}
            onMouseEnter={() => setHovered(s.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-sm text-zinc-600 truncate">{s.label}</span>
            <span className="ml-auto text-sm font-semibold text-zinc-900 tabular-nums">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
