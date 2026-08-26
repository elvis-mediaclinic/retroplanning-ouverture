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

// Poids de pression concurrentielle par type : les réparateurs (surtout en
// réseau) sont les vrais concurrents directs ; les acteurs du cash sans
// service de réparation pèsent peu ; le déstockage n'est pas un concurrent.
const POIDS_TYPE: Record<TypeConcurrent, number> = {
  reparateur_reseau: 1.0,
  reparateur_independant: 0.7,
  cash_avec_reparation: 0.5,
  cash_generaliste: 0.25,
  destockage: 0.0,
};

// Un concurrent à 3 minutes ne compte pas comme un concurrent à 25 minutes :
// pondération dégressive par tranche de distance.
function coefProximite(distanceMinutes: number): number {
  if (distanceMinutes < 5) return 1.0;
  if (distanceMinutes < 10) return 0.7;
  if (distanceMinutes < 20) return 0.4;
  return 0.2;
}

// Coefficient de décroissance exponentielle du score — recalibrable après
// confrontation à des cas réels, sans toucher au reste du calcul.
const COEFFICIENT_DECROISSANCE = 0.35;

function parseZoneChalandise(zone: string | null): number | null {
  if (!zone) return null;
  const n = Number(zone.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

type Categorie = "Marché vierge" | "Marché ouvert" | "Marché normal" | "Marché tendu" | "Marché saturé";

function categoriser(score: number): { categorie: Categorie; detail: string } {
  if (score >= 85) return { categorie: "Marché vierge", detail: "Marché vierge ou quasi vierge" };
  if (score >= 65) return { categorie: "Marché ouvert", detail: "Position de pionnier possible" };
  if (score >= 45) return { categorie: "Marché normal", detail: "Différenciation nécessaire" };
  if (score >= 25) return { categorie: "Marché tendu", detail: "Emplacement décisif" };
  return { categorie: "Marché saturé", detail: "Marché saturé" };
}

function computeStats(concurrents: VilleConcurrent[], zoneChalandise: string | null) {
  // CP : pression concurrentielle pondérée (poids du type × nombre de
  // magasins × coefficient de proximité), sommée sur tous les concurrents.
  const cp = concurrents.reduce(
    (sum, c) => sum + POIDS_TYPE[c.type] * c.nb_magasins * coefProximite(c.distance_minutes),
    0
  );
  const population = parseZoneChalandise(zoneChalandise);

  if (cp === 0) {
    return {
      score: 100,
      categorie: categoriser(100),
      habitantsParConcurrent: null,
      scoreFiable: true,
      nbFranchises: concurrents.filter((c) => c.franchise).length,
    };
  }

  if (!population) {
    // Sans zone de chalandise, impossible de calculer une densité fiable :
    // repli sur un score approximatif basé sur le CP brut, à signaler comme
    // non fiable.
    const scoreApprox = Math.round(Math.max(0, Math.min(100, 100 * Math.exp(-COEFFICIENT_DECROISSANCE * cp))));
    return {
      score: scoreApprox,
      categorie: categoriser(scoreApprox),
      habitantsParConcurrent: null,
      scoreFiable: false,
      nbFranchises: concurrents.filter((c) => c.franchise).length,
    };
  }

  const densitePour100k = (cp / population) * 100000;
  const habitantsParConcurrent = Math.round(population / cp);
  const score = Math.round(Math.max(0, Math.min(100, 100 * Math.exp(-COEFFICIENT_DECROISSANCE * densitePour100k))));

  return {
    score,
    categorie: categoriser(score),
    habitantsParConcurrent,
    scoreFiable: true,
    nbFranchises: concurrents.filter((c) => c.franchise).length,
  };
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
      <div className="grid grid-cols-2 gap-3">
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
          <select name="type" defaultValue={concurrent?.type ?? "destockage"} className="input w-full text-sm">
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
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Distance en voiture (minutes)</label>
          <input
            name="distance_minutes"
            type="number"
            min={0}
            defaultValue={concurrent?.distance_minutes ?? 10}
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
            <p className="text-lg font-semibold text-zinc-900">{stats.score} / 100</p>
            <p className="mt-0.5 text-xs text-zinc-500">{stats.categorie.detail}</p>
            {!stats.scoreFiable && (
              <p className="mt-0.5 text-xs text-amber-600">Zone de chalandise non renseignée — estimation brute</p>
            )}
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-xs text-zinc-400">Habitants / concurrent pondéré</p>
            <p className="text-lg font-semibold text-zinc-900">
              {stats.habitantsParConcurrent !== null
                ? stats.habitantsParConcurrent.toLocaleString("fr-FR")
                : "—"}
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
              <th className="pb-2 font-medium text-right">Distance</th>
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
                    <td colSpan={7} className="py-2">
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
                  <td className="py-2 pr-3 text-right tabular-nums text-zinc-600 whitespace-nowrap">{c.distance_minutes} min</td>
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
