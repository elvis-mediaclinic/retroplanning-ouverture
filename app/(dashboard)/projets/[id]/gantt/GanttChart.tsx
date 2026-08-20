"use client";

import type { EtapeProjet, PhaseEtape } from "@/lib/types";
import { PHASE_LABELS, STATUT_ETAPE_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUT_COLORS: Record<string, string> = {
  fait: "#22c55e",
  en_cours: "#3b82f6",
  a_faire: "#a1a1aa",
  en_retard: "#ef4444",
  na: "#d4d4d8",
};

const PHASES_ORDER: PhaseEtape[] = [
  "administratif_financement",
  "communication",
  "ressources_humaines",
  "travaux_amenagement",
  "formation",
  "stock_fournisseurs",
  "ouverture",
];

function toDay(iso: string) {
  return new Date(iso + "T00:00:00").getTime();
}

export function GanttChart({
  etapes,
  dateOuverture,
  dateCreation,
}: {
  etapes: EtapeProjet[];
  dateOuverture: string | null;
  dateCreation: string;
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const withDate = etapes.filter((e) => e.date_cible);
  if (withDate.length === 0) {
    return <p className="text-zinc-400 text-sm py-8 text-center">Aucune étape avec une date cible.</p>;
  }

  const dates = withDate.map((e) => toDay(e.date_cible!));
  const creationMs = new Date(dateCreation).setHours(0, 0, 0, 0);
  const minMs = Math.min(...dates, creationMs);
  const maxMs = dateOuverture
    ? Math.max(...dates, toDay(dateOuverture), todayMs)
    : Math.max(...dates, todayMs);

  const rangeMs = maxMs - minMs || 1;
  function pct(ms: number) { return Math.max(0, Math.min(100, ((ms - minMs) / rangeMs) * 100)); }

  // Generate month tick marks
  const ticks: { label: string; pct: number }[] = [];
  const cursor = new Date(minMs); cursor.setDate(1);
  while (cursor.getTime() <= maxMs) {
    ticks.push({
      label: cursor.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      pct: pct(cursor.getTime()),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const todayPct = pct(todayMs);
  const ouverturePct = dateOuverture ? pct(toDay(dateOuverture)) : null;

  const etapesParPhase = PHASES_ORDER.reduce<Record<string, EtapeProjet[]>>((acc, ph) => {
    acc[ph] = etapes.filter((e) => e.phase === ph && e.date_cible);
    return acc;
  }, {});

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Timeline header */}
        <div className="flex mb-2 pl-52">
          <div className="flex-1 relative h-5">
            {ticks.map((t) => (
              <span
                key={t.label}
                className="absolute -translate-x-1/2 text-[10px] text-zinc-400 whitespace-nowrap"
                style={{ left: `${t.pct}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Phase rows */}
        {PHASES_ORDER.map((phase) => {
          const rows = etapesParPhase[phase];
          if (!rows || rows.length === 0) return null;
          return (
            <div key={phase} className="mb-4">
              {/* Phase label */}
              <div className="flex items-center mb-1">
                <div className="w-52 shrink-0 pr-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide truncate">
                  {PHASE_LABELS[phase]}
                </div>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              {/* Étape rows */}
              {rows.map((etape) => {
                const cibleMs = toDay(etape.date_cible!);
                const ciblePct = pct(cibleMs);
                const isLate = etape.statut !== "fait" && etape.statut !== "na" && cibleMs < todayMs;
                const color = isLate ? "#ef4444" : STATUT_COLORS[etape.statut] ?? "#a1a1aa";

                return (
                  <div key={etape.id} className="flex items-center h-7 group">
                    <div className="w-52 shrink-0 pr-3 text-xs text-zinc-600 truncate" title={etape.nom}>
                      {etape.nom}
                    </div>
                    <div className="flex-1 relative h-full flex items-center">
                      {/* Background track */}
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-zinc-100" />

                      {/* Bar from left to date_cible */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full opacity-20"
                        style={{ left: 0, width: `${ciblePct}%`, backgroundColor: color }}
                      />

                      {/* Milestone marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 cursor-default"
                        style={{ left: `${ciblePct}%`, transform: "translate(-50%, -50%)", backgroundColor: color }}
                        title={`${etape.nom} — ${STATUT_ETAPE_LABELS[etape.statut]} — ${formatDate(etape.date_cible)}`}
                      />

                      {/* Date label on hover */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20"
                        style={{ left: `${ciblePct}%`, transform: "translateX(-50%) translateY(-150%)" }}
                      >
                        <div className="bg-zinc-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                          {formatDate(etape.date_cible)} · {STATUT_ETAPE_LABELS[etape.statut]}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Today + ouverture lines */}
        <div className="flex mt-2">
          <div className="w-52 shrink-0" />
          <div className="flex-1 relative h-6">
            {/* Today */}
            <div className="absolute top-0 bottom-0 w-px bg-brand/60 z-10" style={{ left: `${todayPct}%` }}>
              <span className="absolute -top-4 -translate-x-1/2 text-[10px] text-brand font-semibold whitespace-nowrap">
                Aujourd&apos;hui
              </span>
            </div>

            {/* Ouverture */}
            {ouverturePct !== null && (
              <div className="absolute top-0 bottom-0 w-px bg-green-500/60 z-10" style={{ left: `${ouverturePct}%` }}>
                <span className="absolute -top-4 -translate-x-1/2 text-[10px] text-green-600 font-semibold whitespace-nowrap">
                  Ouverture
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 mt-6 flex-wrap">
          {[
            { label: "Fait", color: STATUT_COLORS.fait },
            { label: "En cours", color: STATUT_COLORS.en_cours },
            { label: "À faire", color: STATUT_COLORS.a_faire },
            { label: "En retard", color: "#ef4444" },
            { label: "N/A", color: STATUT_COLORS.na },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
