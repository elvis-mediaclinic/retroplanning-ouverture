"use client";

import { useId, useState } from "react";
import dynamic from "next/dynamic";
import { svgUseCurrentColor } from "@/lib/utils";
import { MediaPicker } from "./MediaPicker";
import { SvgIconPicker } from "./SvgIconPicker";

const BlockEditor = dynamic(() => import("./BlockEditor").then((m) => m.BlockEditor), {
  ssr: false,
  loading: () => <div className="rounded-lg border border-zinc-200 bg-zinc-50 h-32 animate-pulse" />,
});

export type Stat = { id: string; valeur: string; label: string };
export type Membre = { id: string; photo?: string; nom: string; texte?: string };

export type Section =
  | { id: string; type?: "texte"; titre: string; contenu_json: string; disposition?: "pleine" | "moitie" | "tiers"; bleu?: boolean; icone?: string; dansAnnonces?: boolean; titreCentre?: boolean; carte?: boolean; separateurDroite?: boolean }
  | { id: string; type: "stats"; titre: string; stats: Stat[]; colonnes: 2 | 3 | 4; alignement?: "gauche" | "centre"; bleu?: boolean; icone?: string; dansAnnonces?: boolean; separateurs?: boolean }
  | { id: string; type: "titre"; titre: string; icone?: string; dansAnnonces?: boolean }
  | { id: string; type: "separateur"; espacement?: "petit" | "moyen" | "grand"; dansAnnonces?: boolean }
  | { id: string; type: "equipe"; titre: string; membres: Membre[]; colonnes?: 2 | 3 | 4; bleu?: boolean; icone?: string; dansAnnonces?: boolean; titreCentre?: boolean; carte?: boolean };

function uid() { return Math.random().toString(36).slice(2); }

function makeSection(type: "texte" | "stats" | "titre" | "separateur" | "equipe"): Section {
  if (type === "stats") {
    return { id: uid(), type: "stats", titre: "", stats: [{ id: uid(), valeur: "", label: "" }], colonnes: 3 };
  }
  if (type === "titre") {
    return { id: uid(), type: "titre", titre: "" };
  }
  if (type === "separateur") {
    return { id: uid(), type: "separateur" };
  }
  if (type === "equipe") {
    return { id: uid(), type: "equipe", titre: "", membres: [{ id: uid(), nom: "", texte: "" }], colonnes: 3 };
  }
  return { id: uid(), type: "texte", titre: "", contenu_json: "" };
}

type Row = { kind: "full"; index: number } | { kind: "group"; cols: 2 | 3; indices: number[] };

function computeRows(sections: Section[]): Row[] {
  const rows: Row[] = [];
  let i = 0;
  while (i < sections.length) {
    const s = sections[i];
    const disp = s.type !== "stats" && s.type !== "titre" && s.type !== "separateur" && s.type !== "equipe" ? s.disposition : undefined;
    if (disp === "moitie" || disp === "tiers") {
      const maxCols = disp === "moitie" ? 2 : 3;
      const indices = [i];
      while (indices.length < maxCols) {
        const next = sections[i + 1];
        if (next && next.type !== "stats" && next.type !== "titre" && next.type !== "separateur" && next.type !== "equipe" && next.disposition === disp) {
          indices.push(i + 1);
          i++;
        } else break;
      }
      rows.push({ kind: "group", cols: maxCols as 2 | 3, indices });
    } else {
      rows.push({ kind: "full", index: i });
    }
    i++;
  }
  return rows;
}

const GROUP_GRID: Record<2 | 3, string> = {
  2: "grid grid-cols-1 sm:grid-cols-2 gap-3",
  3: "grid grid-cols-1 sm:grid-cols-3 gap-3",
};

function InsertRow({ onInsert }: { onInsert: (type: "texte" | "stats" | "titre" | "separateur" | "equipe") => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="group relative h-2 flex items-center justify-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-transparent group-hover:bg-zinc-200 transition-colors" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative z-10 opacity-0 group-hover:opacity-100 rounded-full border border-zinc-300 bg-white w-5 h-5 flex items-center justify-center text-xs text-zinc-400 hover:text-brand hover:border-brand transition-all"
          title="Insérer une section ici"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button type="button" onClick={() => { onInsert("texte"); setOpen(false); }}
        className="flex-1 rounded-lg border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors">
        + Texte
      </button>
      <button type="button" onClick={() => { onInsert("stats"); setOpen(false); }}
        className="flex-1 rounded-lg border border-dashed border-amber-300 py-1.5 text-xs text-amber-600 hover:border-amber-400 hover:text-amber-700 transition-colors">
        + Chiffres clés
      </button>
      <button type="button" onClick={() => { onInsert("titre"); setOpen(false); }}
        className="flex-1 rounded-lg border border-dashed border-violet-300 py-1.5 text-xs text-violet-600 hover:border-violet-400 hover:text-violet-700 transition-colors">
        + Titre
      </button>
      <button type="button" onClick={() => { onInsert("equipe"); setOpen(false); }}
        className="flex-1 rounded-lg border border-dashed border-emerald-300 py-1.5 text-xs text-emerald-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors">
        + Équipe
      </button>
      <button type="button" onClick={() => { onInsert("separateur"); setOpen(false); }}
        className="flex-1 rounded-lg border border-dashed border-zinc-400 py-1.5 text-xs text-zinc-600 hover:border-zinc-500 hover:text-zinc-800 transition-colors">
        + Séparateur
      </button>
      <button type="button" onClick={() => setOpen(false)}
        className="rounded-lg border border-zinc-200 px-2 text-xs text-zinc-400 hover:text-zinc-600">
        ✕
      </button>
    </div>
  );
}

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
        <label className="flex items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer">
          <input
            type="checkbox"
            checked={section.separateurs ?? false}
            onChange={(e) => onUpdate({ separateurs: e.target.checked })}
            className="h-3 w-3 accent-brand"
          />
          Séparateurs entre les chiffres
        </label>
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

function EquipeEditor({ section, onUpdate }: { section: Extract<Section, { type: "equipe" }>; onUpdate: (patch: Partial<Extract<Section, { type: "equipe" }>>) => void }) {
  const [photoPickerId, setPhotoPickerId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500">Colonnes :</label>
        {([2, 3, 4] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onUpdate({ colonnes: n })}
            className={`rounded border px-2 py-0.5 text-xs font-medium ${(section.colonnes ?? 3) === n ? "border-brand bg-brand/10 text-brand" : "border-zinc-300 bg-white text-zinc-500"}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {section.membres.map((membre, i) => (
          <div key={membre.id} className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white p-3">
            <button
              type="button"
              onClick={() => setPhotoPickerId(membre.id)}
              title="Choisir une photo"
              className="shrink-0 h-16 w-16 rounded-full overflow-hidden border border-zinc-300 bg-zinc-100 flex items-center justify-center text-zinc-400 hover:border-brand"
            >
              {membre.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={membre.photo} alt={membre.nom} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px]">Photo</span>
              )}
            </button>
            <div className="flex-1 space-y-2">
              <input
                value={membre.nom}
                onChange={(e) => {
                  const next = [...section.membres];
                  next[i] = { ...membre, nom: e.target.value };
                  onUpdate({ membres: next });
                }}
                placeholder="Nom de la personne"
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm font-medium"
              />
              <textarea
                value={membre.texte ?? ""}
                onChange={(e) => {
                  const next = [...section.membres];
                  next[i] = { ...membre, texte: e.target.value };
                  onUpdate({ membres: next });
                }}
                placeholder="Fonction, description…"
                rows={2}
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ membres: section.membres.filter((_, j) => j !== i) })}
              className="text-xs text-red-400 hover:text-red-600 shrink-0"
            >✕</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onUpdate({ membres: [...section.membres, { id: uid(), nom: "", texte: "" }] })}
        className="text-xs text-brand hover:text-brand-dark"
      >
        + Ajouter une personne
      </button>

      {photoPickerId && (
        <MediaPicker
          onSelect={(url) => {
            const next = section.membres.map((m) => (m.id === photoPickerId ? { ...m, photo: url } : m));
            onUpdate({ membres: next });
            setPhotoPickerId(null);
          }}
          onClose={() => setPhotoPickerId(null)}
        />
      )}
    </div>
  );
}

export function SectionsEditor({ defaultSections, annonceToggle }: { defaultSections?: Section[]; annonceToggle?: boolean }) {
  const inputId = useId();
  const [sections, setSections] = useState<Section[]>(
    defaultSections ?? [{ id: uid(), type: "texte", titre: "", contenu_json: "" }]
  );
  const [iconOpenIds, setIconOpenIds] = useState<Set<string>>(new Set());
  // Toutes les sections existantes démarrent repliées ; les nouvelles s'ouvrent automatiquement.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set((defaultSections ?? []).map((s) => s.id))
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function toggleIconEditor(id: string) {
    setIconOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleCollapsed(id: string) {
    setCollapsedIds((prev) => {
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

  function insertAt(index: number, type: "texte" | "stats" | "titre" | "separateur" | "equipe") {
    setSections((prev) => {
      const next = [...prev];
      next.splice(index, 0, makeSection(type));
      return next;
    });
  }

  function duplicate(index: number) {
    setSections((prev) => {
      const original = prev[index];
      const clone: Section = {
        ...original,
        id: uid(),
        ...(original.type === "stats" ? { stats: original.stats.map((s) => ({ ...s, id: uid() })) } : {}),
        ...(original.type === "equipe" ? { membres: original.membres.map((m) => ({ ...m, id: uid() })) } : {}),
      };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function renderCard(section: Section, i: number) {
    const isStats = section.type === "stats";
    const isTitre = section.type === "titre";
    const isSeparateur = section.type === "separateur";
    const isEquipe = section.type === "equipe";
    const disposition = !isStats && !isTitre && !isSeparateur && !isEquipe ? (section as { disposition?: string }).disposition : undefined;
    const collapsed = collapsedIds.has(section.id);

    if (isSeparateur) {
      return (
        <div
          key={section.id}
          onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
          onDragLeave={() => setDragOverIndex((v) => (v === i ? null : v))}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex !== null) reorder(dragIndex, i);
            setDragIndex(null);
            setDragOverIndex(null);
          }}
          className={`flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 transition-colors ${
            dragOverIndex === i && dragIndex !== null && dragIndex !== i ? "ring-2 ring-brand" : ""
          } ${dragIndex === i ? "opacity-40" : ""}`}
        >
          <span
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
            title="Glisser pour déplacer"
            className="shrink-0 cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 select-none px-0.5"
          >
            ⠿
          </span>
          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-zinc-200 text-zinc-500 shrink-0">
            Séparateur
          </span>
          <div className="flex-1 h-px bg-zinc-300" />
          {annonceToggle && (
            <label className="flex items-center gap-1 rounded border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-600 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={(section as { dansAnnonces?: boolean }).dansAnnonces ?? false}
                onChange={(e) => update(section.id, { dansAnnonces: e.target.checked } as Partial<Section>)}
                className="h-3 w-3 accent-violet-600"
              />
              Dans les annonces
            </label>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <label className="text-xs text-zinc-500 shrink-0">Marges :</label>
            {(["petit", "moyen", "grand"] as const).map((e) => (
              <button
                key={e}
                type="button"
                title={{ petit: "Marges petites", moyen: "Marges moyennes", grand: "Marges grandes" }[e]}
                onClick={() => update(section.id, { espacement: e } as Partial<Section>)}
                className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                  ((section as { espacement?: string }).espacement ?? "moyen") === e ? "border-brand bg-brand/10 text-brand" : "border-zinc-300 bg-white text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {{ petit: "S", moyen: "M", grand: "L" }[e]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Monter"
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1} title="Descendre"
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30">↓</button>
            <button type="button" onClick={() => duplicate(i)} title="Dupliquer"
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50">⧉</button>
            {sections.length > 1 && (
              <button type="button" onClick={() => remove(section.id)} title="Supprimer"
                className="rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-500 hover:bg-red-50">✕</button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        key={section.id}
        onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
        onDragLeave={() => setDragOverIndex((v) => (v === i ? null : v))}
        onDrop={(e) => {
          e.preventDefault();
          if (dragIndex !== null) reorder(dragIndex, i);
          setDragIndex(null);
          setDragOverIndex(null);
        }}
        className={`rounded-lg border p-4 space-y-3 transition-colors ${isStats ? "border-amber-200 bg-amber-50/40" : isTitre ? "border-violet-200 bg-violet-50/40" : isEquipe ? "border-emerald-200 bg-emerald-50/40" : "border-zinc-200 bg-zinc-50"} ${
          dragOverIndex === i && dragIndex !== null && dragIndex !== i ? "ring-2 ring-brand" : ""
        } ${dragIndex === i ? "opacity-40" : ""}`}
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              title="Glisser pour déplacer"
              className="shrink-0 cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 select-none px-0.5"
            >
              ⠿
            </span>
            <button
              type="button"
              onClick={() => toggleCollapsed(section.id)}
              title={collapsed ? "Déployer" : "Replier"}
              className="shrink-0 text-zinc-400 hover:text-zinc-700 w-4 text-xs"
            >
              {collapsed ? "▶" : "▼"}
            </button>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isStats ? "bg-amber-100 text-amber-700" : isTitre ? "bg-violet-100 text-violet-700" : isEquipe ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"}`}>
                {isStats ? "Stats" : isTitre ? "Titre" : isEquipe ? "Équipe" : "Texte"}
              </span>
            </div>
            <input
              type="text"
              value={section.titre}
              onChange={(e) => update(section.id, { titre: e.target.value })}
              placeholder="Titre de la section (optionnel)"
              className="flex-1 min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
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
            {!isStats && !isTitre && (
              <label className="flex items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(section as { titreCentre?: boolean }).titreCentre ?? false}
                  onChange={(e) => update(section.id, { titreCentre: e.target.checked } as Partial<Section>)}
                  className="h-3 w-3 accent-brand"
                />
                Titre centré
              </label>
            )}
            {!isStats && !isTitre && (
              <label className="flex items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(section as { carte?: boolean }).carte ?? (isEquipe ? false : true)}
                  onChange={(e) => update(section.id, { carte: e.target.checked } as Partial<Section>)}
                  className="h-3 w-3 accent-brand"
                />
                {isEquipe ? "Chaque élément dans une carte" : "Carte"}
              </label>
            )}
            {!isStats && !isTitre && !isEquipe && (disposition === "moitie" || disposition === "tiers") && (
              <label className="flex items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(section as { separateurDroite?: boolean }).separateurDroite ?? false}
                  onChange={(e) => update(section.id, { separateurDroite: e.target.checked } as Partial<Section>)}
                  className="h-3 w-3 accent-brand"
                />
                Séparateur à droite
              </label>
            )}
            {annonceToggle && (
              <label className="flex items-center gap-1 rounded border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(section as { dansAnnonces?: boolean }).dansAnnonces ?? false}
                  onChange={(e) => update(section.id, { dansAnnonces: e.target.checked } as Partial<Section>)}
                  className="h-3 w-3 accent-violet-600"
                />
                Dans les annonces
              </label>
            )}
            {!isStats && !isEquipe && (
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
            <button type="button" onClick={() => duplicate(i)} title="Dupliquer"
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50">⧉</button>
            {sections.length > 1 && (
              <button type="button" onClick={() => remove(section.id)} title="Supprimer"
                className="rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-500 hover:bg-red-50">✕</button>
            )}
          </div>
        </div>

        {!collapsed && (
          <>
            {!isStats && !isEquipe && disposition === "moitie" && (
              <p className="text-xs text-brand/70">½ largeur — se positionne côte à côte avec la section adjacente en ½</p>
            )}
            {!isStats && !isEquipe && disposition === "tiers" && (
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
                <SvgIconPicker
                  value={(section as { icone?: string }).icone ?? ""}
                  onChange={(svg) => update(section.id, { icone: svg } as Partial<Section>)}
                />
                <p className="text-xs text-zinc-400">
                  Choisissez une icône déjà enregistrée, ou collez le code d&apos;un nouveau pictogramme SVG
                  (quelle que soit sa couleur d&apos;origine, elle est automatiquement adaptée — blanc sur
                  fond bleu, bleu sur fond clair) puis « + Bibliothèque » pour la réutiliser ailleurs.
                </p>
              </div>
            )}

            {/* Contenu */}
            {isStats ? (
              <StatsEditor
                section={section as Extract<Section, { type: "stats" }>}
                onUpdate={(patch) => update(section.id, patch as Partial<Section>)}
              />
            ) : isEquipe ? (
              <EquipeEditor
                section={section as Extract<Section, { type: "equipe" }>}
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
          </>
        )}
      </div>
    );
  }

  const rows = computeRows(sections);

  return (
    <div className="space-y-4">
      <input type="hidden" name="sections" id={inputId} value={JSON.stringify(sections)} />

      <InsertRow onInsert={(type) => insertAt(0, type)} />

      {rows.map((row, ri) => {
        const lastIndex = row.kind === "full" ? row.index : row.indices[row.indices.length - 1];
        return (
          <div key={ri} className="space-y-4">
            {row.kind === "full" ? (
              renderCard(sections[row.index], row.index)
            ) : (
              <div className={GROUP_GRID[row.cols]}>
                {row.indices.map((idx) => renderCard(sections[idx], idx))}
              </div>
            )}
            <InsertRow onInsert={(type) => insertAt(lastIndex + 1, type)} />
          </div>
        );
      })}

      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => insertAt(sections.length, "texte")}
          className="flex-1 rounded-lg border border-dashed border-zinc-300 py-2.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors">
          + Texte
        </button>
        <button type="button" onClick={() => insertAt(sections.length, "stats")}
          className="flex-1 rounded-lg border border-dashed border-amber-300 py-2.5 text-sm text-amber-600 hover:border-amber-400 hover:text-amber-700 transition-colors">
          + Chiffres clés
        </button>
        <button type="button" onClick={() => insertAt(sections.length, "titre")}
          className="flex-1 rounded-lg border border-dashed border-violet-300 py-2.5 text-sm text-violet-600 hover:border-violet-400 hover:text-violet-700 transition-colors">
          + Titre
        </button>
        <button type="button" onClick={() => insertAt(sections.length, "equipe")}
          className="flex-1 rounded-lg border border-dashed border-emerald-300 py-2.5 text-sm text-emerald-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors">
          + Équipe
        </button>
        <button type="button" onClick={() => insertAt(sections.length, "separateur")}
          className="flex-1 rounded-lg border border-dashed border-zinc-400 py-2.5 text-sm text-zinc-600 hover:border-zinc-500 hover:text-zinc-800 transition-colors">
          + Séparateur
        </button>
      </div>
    </div>
  );
}
