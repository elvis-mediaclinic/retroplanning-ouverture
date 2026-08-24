"use client";

import { useId, useState } from "react";
import dynamic from "next/dynamic";
import { svgUseCurrentColor } from "@/lib/utils";

const BlockEditor = dynamic(() => import("./BlockEditor").then((m) => m.BlockEditor), {
  ssr: false,
  loading: () => <div className="rounded-lg border border-zinc-200 bg-zinc-50 h-32 animate-pulse" />,
});

export type Stat = { id: string; valeur: string; label: string };

export type Section =
  | { id: string; type?: "texte"; titre: string; contenu_json: string; disposition?: "pleine" | "moitie" | "tiers"; bleu?: boolean; icone?: string }
  | { id: string; type: "stats"; titre: string; stats: Stat[]; colonnes: 2 | 3 | 4; alignement?: "gauche" | "centre"; bleu?: boolean; icone?: string }
  | { id: string; type: "titre"; titre: string; icone?: string };

function uid() { return Math.random().toString(36).slice(2); }

function StatsEditor({ section, onUpdate }: { section: Extract<Section, { type: "stats" }>; onUpdate: (patch: Partial<Extract<Section, { type: "stats" }>>) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">Colonnes :</label>
          {([2, 3, 4] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onUpdate({ colonnes: n })}
              className={`rounded border px-2 py-0.5 text-xs font-medium ${section.colonnes === n ? "border-brand bg-brand/10 text-brand" : "border-zinc-300 bg-white text-zinc-500"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">Alignement :</label>
          {(["gauche", "centre"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onUpdate({ alignement: a })}
              className={`rounded border px-2 py-0.5 text-xs font-medium ${(section.alignement ?? "gauche") === a ? "border-brand bg-brand/10 text-brand" : "border-zinc-300 bg-white text-zinc-500"}`}
            >
              {a === "gauche" ? "⬤ Gauche" : "◉ Centré"}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {section.stats.map((stat, i) => (
          <div key={stat.id} className="flex items-center gap-2">
            <input
              value={stat.valeur}
              onChange={(e) => {
                const next = [...section.stats];
                next[i] = { ...stat, valeur: e.target.value };
                onUpdate({ stats: next });
              }}
              placeholder="70 000"
              className="w-32 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm font-bold text-center"
            />
            <input
              value={stat.label}
              onChange={(e) => {
                const next = [...section.stats];
                next[i] = { ...stat, label: e.target.value };
                onUpdate({ stats: next });
              }}
              placeholder="habitants dans la zone"
              className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => onUpdate({ stats: section.stats.filter((_, j) => j !== i) })}
              className="text-xs text-red-400 hover:text-red-600"
            >✕</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onUpdate({ stats: [...section.stats, { id: uid(), valeur: "", label: "" }] })}
        className="text-xs text-brand hover:text-brand-dark"
      >
        + Ajouter un chiffre
      </button>
    </div>
  );
}

export function SectionsEditor({ defaultSections }: { defaultSections?: Section[] }) {
  const inputId = useId();
  const [sections, setSections] = useState<Section[]>(
    defaultSections ?? [{ id: uid(), type: "texte", titre: "", contenu_json: "" }]
  );
  const [iconOpenIds, setIconOpenIds] = useState<Set<string>>(new Set());

  function toggleIconEditor(id: string) {
    setIconOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function update(id: string, patch: Partial<Section>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } as Section : s)));
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

  function addTexte() {
    setSections((prev) => [...prev, { id: uid(), type: "texte", titre: "", contenu_json: "" }]);
  }

  function addStats() {
    setSections((prev) => [...prev, {
      id: uid(),
      type: "stats",
      titre: "",
      stats: [{ id: uid(), valeur: "", label: "" }],
      colonnes: 3,
    }]);
  }

  function addTitre() {
    setSections((prev) => [...prev, { id: uid(), type: "titre", titre: "" }]);
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="sections" id={inputId} value={JSON.stringify(sections)} />

      {sections.map((section, i) => {
        const isStats = section.type === "stats";
        const isTitre = section.type === "titre";
        const disposition = !isStats && !isTitre ? (section as { disposition?: string }).disposition : undefined;

        return (
          <div key={section.id} className={`rounded-lg border p-4 space-y-3 ${isStats ? "border-amber-200 bg-amber-50/40" : isTitre ? "border-violet-200 bg-violet-50/40" : "border-zinc-200 bg-zinc-50"}`}>
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isStats ? "bg-amber-100 text-amber-700" : isTitre ? "bg-violet-100 text-violet-700" : "bg-zinc-200 text-zinc-500"}`}>
                  {isStats ? "Stats" : isTitre ? "Titre" : "Texte"}
                </span>
              </div>
              <input
                type="text"
                value={section.titre}
                onChange={(e) => update(section.id, { titre: e.target.value })}
                placeholder="Titre de la section (optionnel)"
                className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleIconEditor(section.id)}
                  title="Icône SVG (optionnelle)"
                  className={`flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium ${
                    iconOpenIds.has(section.id) || (section as { icone?: string }).icone
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-zinc-300 bg-white text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {(section as { icone?: string }).icone ? (
                    <span
                      className="w-3.5 h-3.5 [&_svg]:w-full [&_svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: svgUseCurrentColor((section as { icone?: string }).icone!) }}
                    />
                  ) : null}
                  Icône
                </button>
                {!isTitre && (
                  <label className="flex items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(section as { bleu?: boolean }).bleu ?? false}
                      onChange={(e) => update(section.id, { bleu: e.target.checked } as Partial<Section>)}
                      className="h-3 w-3 accent-brand"
                    />
                    Fond bleu
                  </label>
                )}
                {!isStats && (
                  <>
                    {(["pleine", "moitie", "tiers"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        title={{ pleine: "Pleine largeur", moitie: "½ largeur (2 colonnes)", tiers: "⅓ largeur (3 colonnes)" }[d]}
                        onClick={() => update(section.id, { disposition: d } as Partial<Section>)}
                        className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                          (disposition ?? "pleine") === d ? "border-brand bg-brand/10 text-brand" : "border-zinc-300 bg-white text-zinc-400 hover:text-zinc-600"
                        }`}
                      >
                        {{ pleine: "▬", moitie: "½", tiers: "⅓" }[d]}
                      </button>
                    ))}
                  </>
                )}
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Monter"
                  className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1} title="Descendre"
                  className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30">↓</button>
                {sections.length > 1 && (
                  <button type="button" onClick={() => remove(section.id)} title="Supprimer"
                    className="rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-500 hover:bg-red-50">✕</button>
                )}
              </div>
            </div>
            {!isStats && disposition === "moitie" && (
              <p className="text-xs text-brand/70">½ largeur — se positionne côte à côte avec la section adjacente en ½</p>
            )}
            {!isStats && disposition === "tiers" && (
              <p className="text-xs text-brand/70">⅓ largeur — se regroupe avec les sections adjacentes en ⅓ (max 3)</p>
            )}

            {iconOpenIds.has(section.id) && (
              <div className="space-y-1 rounded-md border border-brand/30 bg-brand/5 p-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700">Code SVG de l&apos;icône</label>
                  {(section as { icone?: string }).icone && (
                    <button
                      type="button"
                      onClick={() => update(section.id, { icone: undefined } as Partial<Section>)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Retirer l&apos;icône
                    </button>
                  )}
                </div>
                <textarea
                  value={(section as { icone?: string }).icone ?? ""}
                  onChange={(e) => update(section.id, { icone: e.target.value || undefined } as Partial<Section>)}
                  placeholder='<svg viewBox="0 0 24 24" fill="black">...</svg>'
                  rows={3}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-mono"
                />
                <p className="text-xs text-zinc-400">
                  Collez le code d&apos;un pictogramme SVG, quelle que soit sa couleur d&apos;origine :
                  elle est automatiquement adaptée (blanc sur fond bleu, bleu sur fond clair).
                </p>
              </div>
            )}

            {/* Contenu */}
            {isStats ? (
              <StatsEditor
                section={section as Extract<Section, { type: "stats" }>}
                onUpdate={(patch) => update(section.id, patch as Partial<Section>)}
              />
            ) : isTitre ? (
              <p className="text-xs text-violet-500/70 italic">Le titre saisi ci-dessus s&apos;affichera centré sans carte.</p>
            ) : (
              <BlockEditor
                defaultJson={(section as { contenu_json: string }).contenu_json || null}
                onJsonChange={(json) => update(section.id, { contenu_json: json } as Partial<Section>)}
              />
            )}
          </div>
        );
      })}

      <div className="flex gap-2">
        <button type="button" onClick={addTexte}
          className="flex-1 rounded-lg border border-dashed border-zinc-300 py-2.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors">
          + Texte
        </button>
        <button type="button" onClick={addStats}
          className="flex-1 rounded-lg border border-dashed border-amber-300 py-2.5 text-sm text-amber-600 hover:border-amber-400 hover:text-amber-700 transition-colors">
          + Chiffres clés
        </button>
        <button type="button" onClick={addTitre}
          className="flex-1 rounded-lg border border-dashed border-violet-300 py-2.5 text-sm text-violet-600 hover:border-violet-400 hover:text-violet-700 transition-colors">
          + Titre
        </button>
      </div>
    </div>
  );
}
