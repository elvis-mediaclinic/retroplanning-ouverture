"use client";

import { useId, useState } from "react";
import dynamic from "next/dynamic";

const BlockEditor = dynamic(() => import("./BlockEditor").then((m) => m.BlockEditor), {
  ssr: false,
  loading: () => <div className="rounded-lg border border-zinc-200 bg-zinc-50 h-32 animate-pulse" />,
});

export type Section = {
  id: string;
  titre: string;
  contenu_json: string;
  disposition?: "pleine" | "moitie";
};

function uid() {
  return Math.random().toString(36).slice(2);
}

export function SectionsEditor({
  defaultSections,
}: {
  defaultSections?: Section[];
}) {
  const inputId = useId();
  const [sections, setSections] = useState<Section[]>(
    defaultSections ?? [{ id: uid(), titre: "", contenu_json: "" }]
  );

  function update(id: string, patch: Partial<Section>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function move(index: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function add() {
    setSections((prev) => [...prev, { id: uid(), titre: "", contenu_json: "" }]);
  }

  return (
    <div className="space-y-4">
      <input
        type="hidden"
        name="sections"
        id={inputId}
        value={JSON.stringify(sections)}
      />

      {sections.map((section, i) => (
        <div
          key={section.id}
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3"
        >
          {/* Header section */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={section.titre}
              onChange={(e) => update(section.id, { titre: e.target.value })}
              placeholder="Titre de la section (optionnel)"
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium"
            />
            <div className="flex items-center gap-1 shrink-0">
              {/* Disposition */}
              <button
                type="button"
                title={section.disposition === "moitie" ? "Passer en pleine largeur" : "Passer en demi-largeur (côte à côte)"}
                onClick={() => update(section.id, { disposition: section.disposition === "moitie" ? "pleine" : "moitie" })}
                className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                  section.disposition === "moitie"
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-zinc-300 bg-white text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {section.disposition === "moitie" ? "½" : "▬"}
              </button>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                title="Monter"
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === sections.length - 1}
                title="Descendre"
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30"
              >
                ↓
              </button>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(section.id)}
                  title="Supprimer"
                  className="rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          {section.disposition === "moitie" && (
            <p className="text-xs text-brand/70">½ largeur — se positionne côte à côte avec la section adjacente en demi-largeur</p>
          )}

          {/* Éditeur de contenu */}
          <BlockEditor
            defaultJson={section.contenu_json || null}
            onJsonChange={(json) => update(section.id, { contenu_json: json })}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full rounded-lg border border-dashed border-zinc-300 py-2.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
      >
        + Ajouter une section
      </button>
    </div>
  );
}
