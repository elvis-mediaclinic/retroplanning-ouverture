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
    <div className="space-y-6">
      {/* Liste des magasins ouverts */}
      <div className="max-h-64 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {points.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              className={`w-full h-full text-left px-4 py-3 border-r border-b border-zinc-100 transition-colors ${
                selectedId === m.id ? "bg-[#0089bd]/10" : "hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                    m.type === "integre" ? "bg-[#7c3aed]" : "bg-[#0089bd]"
                  }`}
                />
                <p className="text-sm font-semibold text-zinc-900">{m.nom}</p>
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
      </div>

      {/* Carte */}
      <div className="h-96 sm:h-[500px]">
        <MagasinsMap points={points} villesEnEtude={villesEnEtude} selectedId={selectedId} />
      </div>

      {/* Liste des villes en étude (annonce active) */}
      {villesEnEtude.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Villes en étude — opportunités à pourvoir</h3>
          <div className="max-h-64 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
              {villesEnEtude.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={`w-full h-full text-left px-4 py-3 border-r border-b border-zinc-100 transition-colors ${
                    selectedId === v.id ? "bg-amber-50" : "hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full shrink-0 bg-amber-500" />
                    <p className="text-sm font-semibold text-zinc-900">{v.nom}</p>
                  </div>
                  {v.departement && (
                    <p className="mt-0.5 text-xs text-zinc-500 pl-4">{v.departement}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
