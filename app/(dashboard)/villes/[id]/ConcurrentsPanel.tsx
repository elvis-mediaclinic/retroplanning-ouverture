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
          <select name="type" defaultValue={concurrent?.type ?? "autre"} className="input w-full text-sm">
            {(Object.entries(TYPE_CONCURRENT_LABELS) as [TypeConcurrent, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
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
}: {
  villeId: string;
  concurrents: VilleConcurrent[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...concurrents].sort((a, b) => a.enseigne.localeCompare(b.enseigne));

  return (
    <div className="space-y-4">
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

      <ul className="space-y-2">
        {sorted.map((c) => {
          if (editingId === c.id) {
            return (
              <li key={c.id}>
                <ConcurrentForm villeId={villeId} concurrent={c} onDone={() => setEditingId(null)} />
              </li>
            );
          }
          return (
            <li key={c.id} className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-900">{c.enseigne}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {TYPE_CONCURRENT_LABELS[c.type]}
                  </span>
                  {c.franchise ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Franchise
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-400">
                      Indépendant
                    </span>
                  )}
                </div>
                {c.notes && <p className="mt-1 text-sm text-zinc-600 whitespace-pre-line">{c.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
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
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Suppr.
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
