"use client";

import { useState } from "react";
import { TYPE_CONCURRENT_LABELS, type TypeConcurrent } from "@/lib/types";

// Couleurs de statut (réutilise le vocabulaire déjà utilisé pour les badges
// de statut ailleurs dans l'admin : vert = sain, ambre = attention, rouge =
// risque), pas une couleur arbitraire pour une métrique de risque/santé.
function scoreColor(score: number) {
  if (score >= 65) return "#22c55e"; // vert — vierge / ouvert
  if (score >= 45) return "#f59e0b"; // ambre — normal
  if (score >= 25) return "#f97316"; // orange — tendu
  return "#ef4444"; // rouge — saturé
}

export function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = scoreColor(score);
  const cx = 90, cy = 90, r = 72;
  const startAngle = Math.PI, endAngle = 2 * Math.PI; // demi-cercle haut
  const angle = startAngle + (score / 100) * (endAngle - startAngle);

  function point(a: number) {
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  }

  const [sx, sy] = point(startAngle);
  const [ex, ey] = point(angle);
  const large = angle - startAngle > Math.PI ? 1 : 0;

  const [bgEx, bgEy] = point(endAngle - 0.001);

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="105" viewBox="0 0 180 105" aria-hidden="true">
        {/* Fond du demi-cercle */}
        <path
          d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${bgEx} ${bgEy}`}
          fill="none"
          stroke="var(--color-zinc-100, #f4f4f5)"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Valeur */}
        {score > 0 && (
          <path
            d={`M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
          />
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 28, fontWeight: 700, fill: "#18181b" }}>
          {score}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 11, fill: "#a1a1aa" }}>
          / 100
        </text>
      </svg>
      <p className="-mt-1 text-sm font-medium" style={{ color }}>{label}</p>
    </div>
  );
}

// Ordre fixe du plus au moins menaçant : encode une magnitude (degré de
// menace directe), pas une identité arbitraire — d'où une rampe à teinte
// unique du plus foncé (réparateur réseau) au plus clair (déstockage), et
// non des teintes catégorielles indépendantes.
const TYPE_ORDER: TypeConcurrent[] = [
  "reparateur_reseau",
  "reparateur_independant",
  "cash_avec_reparation",
  "cash_generaliste",
  "destockage",
];
const TYPE_RAMP: Record<TypeConcurrent, string> = {
  reparateur_reseau: "#00485f",
  reparateur_independant: "#00729e",
  cash_avec_reparation: "#0089bd",
  cash_generaliste: "#5bb9d9",
  destockage: "#c7e4ef",
};

export function CpParTypeBars({ cpParType }: { cpParType: Record<TypeConcurrent, number> }) {
  const [hovered, setHovered] = useState<TypeConcurrent | null>(null);
  const max = Math.max(0.001, ...Object.values(cpParType));

  return (
    <div className="space-y-2">
      {TYPE_ORDER.map((t) => {
        const value = cpParType[t] ?? 0;
        const pct = (value / max) * 100;
        return (
          <div
            key={t}
            className="flex items-center gap-3"
            onMouseEnter={() => setHovered(t)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-40 shrink-0 text-xs text-zinc-600 truncate">{TYPE_CONCURRENT_LABELS[t]}</span>
            <div className="flex-1 h-3 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-150"
                style={{
                  width: `${value > 0 ? Math.max(pct, 3) : 0}%`,
                  background: TYPE_RAMP[t],
                  opacity: hovered === null || hovered === t ? 1 : 0.5,
                }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-zinc-500">
              {value > 0 ? value.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
