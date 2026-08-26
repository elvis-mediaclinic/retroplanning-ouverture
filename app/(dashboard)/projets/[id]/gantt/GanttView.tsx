"use client";

import { useState } from "react";
import Link from "next/link";
import type { EtapeProjet } from "@/lib/types";
import { GanttChart } from "./GanttChart";

function MaximizeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export function GanttView({
  projetId,
  projetNom,
  isMC,
  canEdit,
  etapes,
  dateOuverture,
  dateCreation,
}: {
  projetId: string;
  projetNom: string;
  isMC: boolean;
  canEdit: boolean;
  etapes: EtapeProjet[];
  dateOuverture: string | null;
  dateCreation: string;
}) {
  const [fullscreen, setFullscreen] = useState(false);

  const chart = (
    <GanttChart
      etapes={etapes}
      dateOuverture={dateOuverture}
      dateCreation={dateCreation}
      projetId={projetId}
      canEdit={canEdit}
    />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-[#00729e] to-[#0089bd] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 shrink-0">
          <h1 className="text-xl font-bold uppercase text-white truncate">Gantt — {projetNom}</h1>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="shrink-0 flex items-center gap-2 rounded-md border border-white/40 px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-colors"
          >
            <MinimizeIcon />
            Quitter le plein écran
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">{chart}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase text-[#0089bd]">Gantt — {projetNom}</h1>
        <Link
          href={`/projets/${projetId}`}
          className="btn-secondary"
        >
          Vue liste
        </Link>
      </div>
      <div>
        <Link
          href={isMC ? `/projets/${projetId}` : "/mon-projet"}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← {projetNom}
        </Link>
      </div>

      <div className="relative rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm">
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          title="Plein écran"
          className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors"
        >
          <MaximizeIcon />
        </button>
        {chart}
      </div>
    </div>
  );
}
