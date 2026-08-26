"use client";

import { useActionState, useState } from "react";
import {
  createConcurrent,
  updateConcurrent,
  deleteConcurrent,
  type ConcurrentState,
} from "../concurrents-actions";
import {
  TYPE_CONCURRENT_LABELS,
  type VilleConcurrent,
  type TypeConcurrent,
} from "@/lib/types";

// Poids de pression concurrentielle : les réparateurs sont les vrais
// concurrents directs (réparation/reconditionnement), les acteurs du cash
// vendent de l'occasion mais n'ont pas ce service, d'où un poids bien moindre.
const SATURATION_WEIGHTS: Record<TypeConcurrent, number> = {
  reparateur: 3,
  revendeur: 1.5,
  cash: 0.5,
  autre: 0.5,
};

function parseZoneChalandise(zone: string | null): number | null {
  if (!zone) return null;
  const n = Number(zone.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Densité de référence (unités de pression pondérée pour 100 000 habitants)
// à partir de laquelle le marché est considéré comme totalement saturé (10/10).
// Ex. 4 réparateurs (poids 3) + 2 acteurs du cash (poids 0.5) = 13 points ;
// sur 200 000 hab -> densité 6.5/100k -> ~8/10 (chargé) ; sur 1 000 000 hab
// -> densité 1.3/100k -> ~1.6/10 (peu saturé) : le même nombre d'enseignes
// ne pèse pas pareil selon la taille du marché.
const DENSITE_SATURATION_MAX = 8;

function computeStats(concurrents: VilleConcurrent[], zoneChalandise: string | null) {
  const weighted = concurrents.reduce((sum, c) => sum + SATURATION_WEIGHTS[c.type] * c.nb_magasins, 0);
  const population = parseZoneChalandise(zoneChalandise);

  // Avec zone de chalandise : score basé sur la densité concurrentielle
  // (pression pondérée pour 100 000 hab). Sans zone renseignée : repli sur
  // le total pondéré brut, moins fiable (ne reflète pas la taille du marché).
  const densitePour100k = population ? (weighted * 100000) / population : null;
  const score = densitePour100k !== null
    ? Math.min(10, Math.round((densitePour100k / DENSITE_SATURATION_MAX) * 100) / 10)
    : Math.min(10, Math.round(weighted * 10) / 10);

  const nbReparateurs = concurrents
    .filter((c) => c.type === "reparateur")
    .reduce((sum, c) => sum + c.nb_magasins, 0);
  const habitantsParReparateur = population && nbReparateurs > 0 ? Math.round(population / nbReparateurs) : null;

  const nbFranchises = concurrents.filter((c) => c.franchise).length;

  return { score, scoreFiable: densitePour100k !== null, habitantsParReparateur, nbFranchises, nbReparateurs };
}

function ConcurrentForm({
  villeId,
  concurrent,
  onDone,
}: {
  villeId: string;
  concurrent?: VilleConcurrent;
  onDone: () => void;
}) {
  const action = concurrent
    ? updateConcurrent.bind(null, concurrent.id, villeId)
    : createConcurrent.bind(null, villeId);
  const [state, formAction, pending] = useActionState<ConcurrentState, FormData>(action, undefined);

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
        onDone();
      }}
      className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4"
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Enseigne</label>
          <input
            name="enseigne"
            required
            defaultValue={concurrent?.enseigne ?? ""}
            placeholder="ex : Cash Express"
            className="input w-full text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Type</label>
          <select name="type" defaultValue={concurrent?.type ?? "autre"} className="input w-full text-sm">
            {(Object.entries(TYPE_CONCURRENT_LABELS) as [TypeConcurrent, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Magasins dans la zone</label>
          <input
            name="nb_magasins"
            type="number"
            min={1}
            defaultValue={concurrent?.nb_magasins ?? 1}
            className="input w-full text-sm"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
        <input
          type="checkbox"
          name="franchise"
          value="true"
          defaultChecked={concurrent?.franchise ?? false}
          className="rounded border-zinc-300 text-brand accent-brand"
        />
        Franchise (enseigne structurée, marqueur d&apos;un marché porteur)
      </label>
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600">Notes</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={concurrent?.notes ?? ""}
          className="input w-full text-sm resize-none"
          placeholder="Adresse, positionnement, ancienneté…"
        />
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="btn-secondary text-xs px-3 py-1.5">
          Annuler
        </button>
        <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
          {pending ? "Enregistrement…" : concurrent ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}

export function ConcurrentsPanel({
  villeId,
  concurrents,
  zoneChalandise,
}: {
  villeId: string;
  concurrents: VilleConcurrent[];
  zoneChalandise: string | null;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...concurrents].sort((a, b) => a.enseigne.localeCompare(b.enseigne));
  const stats = computeStats(concurrents, zoneChalandise);

  return (
    <div className="space-y-4">
      {concurrents.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-xs text-zinc-400">Saturation concurrentielle</p>
            <p className="text-lg font-semibold text-zinc-900">{stats.score.toLocaleString("fr-FR")} / 10</p>
            {!stats.scoreFiable && (
              <p className="mt-0.5 text-xs text-amber-600">Zone de chalandise non renseignée — estimation brute</p>
            )}
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-xs text-zinc-400">Habitants / réparateur</p>
            <p className="text-lg font-semibold text-zinc-900">
              {stats.habitantsParReparateur !== null
                ? stats.habitantsParReparateur.toLocaleString("fr-FR")
                : stats.nbReparateurs === 0 ? "Aucun réparateur" : "—"}
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-xs text-zinc-400">Marché prouvé</p>
            <p className="text-lg font-semibold text-zinc-900">
              {stats.nbFranchises > 0
                ? `${stats.nbFranchises} franchise${stats.nbFranchises > 1 ? "s" : ""} en place`
                : "Aucune franchise"}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {concurrents.length === 0
            ? "Aucun concurrent recensé pour le moment."
            : `${concurrents.length} concurrent${concurrents.length > 1 ? "s" : ""} recensé${concurrents.length > 1 ? "s" : ""}`}
        </p>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="btn-secondary text-xs px-3 py-1.5">
            + Ajouter un concurrent
          </button>
        )}
      </div>

      {adding && (
        <ConcurrentForm villeId={villeId} onDone={() => setAdding(false)} />
      )}

      {sorted.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-400">
              <th className="pb-2 font-medium">Enseigne</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium text-right">Magasins</th>
              <th className="pb-2 font-medium">Structure</th>
              <th className="pb-2 font-medium">Notes</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sorted.map((c) => {
              if (editingId === c.id) {
                return (
                  <tr key={c.id}>
                    <td colSpan={6} className="py-2">
                      <ConcurrentForm villeId={villeId} concurrent={c} onDone={() => setEditingId(null)} />
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={c.id}>
                  <td className="py-2 pr-3 font-medium text-zinc-900 whitespace-nowrap">{c.enseigne}</td>
                  <td className="py-2 pr-3 text-zinc-600 whitespace-nowrap">{TYPE_CONCURRENT_LABELS[c.type]}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-zinc-600">{c.nb_magasins}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {c.franchise ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Franchise
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">Indépendant</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-zinc-500">{c.notes || "—"}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => { setEditingId(c.id); setAdding(false); }}
                      className="text-xs text-zinc-500 hover:text-zinc-900"
                    >
                      Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteConcurrent(c.id, villeId)}
                      className="ml-3 text-xs text-red-500 hover:text-red-700"
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
