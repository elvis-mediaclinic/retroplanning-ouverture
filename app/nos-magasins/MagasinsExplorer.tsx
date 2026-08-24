"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { MagasinPoint, VilleEnEtudePoint } from "./MagasinsMap";

const MagasinsMap = dynamic(() => import("./MagasinsMap").then((m) => m.MagasinsMap), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />,
});

export function MagasinsExplorer({
  points,
  villesEnEtude,
}: {
  points: MagasinPoint[];
  villesEnEtude: VilleEnEtudePoint[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
      {/* Liste */}
      <div className="lg:w-72 shrink-0 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-100">
        {points.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedId(m.id)}
            className={`w-full text-left px-4 py-3 transition-colors ${
              selectedId === m.id ? "bg-[#0089bd]/10" : "hover:bg-zinc-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                  m.type === "integre" ? "bg-[#7c3aed]" : "bg-[#0089bd]"
                }`}
              />
              <p className="text-sm font-semibold text-zinc-900 truncate">{m.nom}</p>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 pl-4">
              {[m.codePostal, m.ville].filter(Boolean).join(" ") || "—"}
            </p>
          </button>
        ))}
        {points.length === 0 && (
          <p className="px-4 py-3 text-sm text-zinc-400">Aucun magasin ouvert pour le moment.</p>
        )}
      </div>

      {/* Carte */}
      <div className="flex-1 min-h-[400px]">
        <MagasinsMap points={points} villesEnEtude={villesEnEtude} selectedId={selectedId} />
      </div>
    </div>
  );
}
