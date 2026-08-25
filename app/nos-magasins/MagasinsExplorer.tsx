"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { MagasinPoint, VilleEnEtudePoint } from "./MagasinsMap";

const MagasinsMap = dynamic(() => import("./MagasinsMap").then((m) => m.MagasinsMap), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />,
});

// Nombre d'éléments "de remplissage" invisibles ajoutés après la liste : ils
// absorbent l'espace libre de la dernière ligne (incomplète) pour que
// justify-between n'espace pas ses quelques éléments jusqu'aux bords, tout en
// laissant les lignes complètes s'étirer naturellement jusqu'au bord.
const FILLERS = Array.from({ length: 12 });

function JustifiedList<T>({
  items,
  keyFn,
  selectedId,
  onSelect,
  renderItem,
  selectedClass,
  emptyLabel,
}: {
  items: T[];
  keyFn: (item: T) => string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  renderItem: (item: T) => ReactNode;
  selectedClass: string;
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-wrap justify-between">
      {items.map((item) => {
        const id = keyFn(item);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`whitespace-nowrap text-left px-4 py-3 border-b border-zinc-100 transition-colors ${
              selectedId === id ? selectedClass : "hover:bg-zinc-50"
            }`}
          >
            {renderItem(item)}
          </button>
        );
      })}
      {items.length === 0 && (
        <p className="px-4 py-3 text-sm text-zinc-400">{emptyLabel}</p>
      )}
      {FILLERS.map((_, i) => (
        <span key={`filler-${i}`} aria-hidden className="h-0 w-[200px]" />
      ))}
    </div>
  );
}

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
        <JustifiedList
          items={points}
          keyFn={(m) => m.id}
          selectedId={selectedId}
          onSelect={setSelectedId}
          selectedClass="bg-[#0089bd]/10"
          emptyLabel="Aucun magasin ouvert pour le moment."
          renderItem={(m) => (
            <>
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
            </>
          )}
        />
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
            <JustifiedList
              items={villesEnEtude}
              keyFn={(v) => v.id}
              selectedId={selectedId}
              onSelect={setSelectedId}
              selectedClass="bg-amber-50"
              emptyLabel="Aucune ville en étude pour le moment."
              renderItem={(v) => (
                <>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full shrink-0 bg-amber-500" />
                    <p className="text-sm font-semibold text-zinc-900">{v.nom}</p>
                  </div>
                  {v.departement && (
                    <p className="mt-0.5 text-xs text-zinc-500 pl-4">{v.departement}</p>
                  )}
                </>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
