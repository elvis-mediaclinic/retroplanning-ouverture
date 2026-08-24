"use client";

import { useActionState, useState } from "react";
import {
  createInteraction,
  updateInteraction,
  deleteInteraction,
  type InteractionState,
} from "../interactions-actions";
import {
  TYPE_INTERACTION_LABELS,
  type CandidatInteraction,
  type TypeInteraction,
} from "@/lib/types";

const TYPE_ICONS: Record<TypeInteraction, string> = {
  appel: "📞",
  email: "✉️",
  visio: "🖥️",
  visite_siege: "🏢",
  immersion_magasin: "🛍️",
  visite_ville_candidat: "📍",
  autre: "•",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toLocalInputValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function InteractionForm({
  candidatId,
  interaction,
  defaultType = "autre",
  onDone,
}: {
  candidatId: string;
  interaction?: CandidatInteraction;
  defaultType?: TypeInteraction;
  onDone: () => void;
}) {
  const action = interaction
    ? updateInteraction.bind(null, interaction.id, candidatId)
    : createInteraction.bind(null, candidatId);
  const [state, formAction, pending] = useActionState<InteractionState, FormData>(action, undefined);

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
          <label className="text-xs font-medium text-zinc-600">Type</label>
          <select name="type" defaultValue={interaction?.type ?? defaultType} className="input w-full text-sm">
            {(Object.entries(TYPE_INTERACTION_LABELS) as [TypeInteraction, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Date</label>
          <input
            name="date_realisee"
            type="datetime-local"
            defaultValue={toLocalInputValue(interaction?.date_realisee)}
            required
            className="input w-full text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600">Notes</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={interaction?.notes ?? ""}
          className="input w-full text-sm resize-none"
          placeholder="Créneaux proposés, retours du candidat…"
        />
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="btn-secondary text-xs px-3 py-1.5">
          Annuler
        </button>
        <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
          {pending ? "Enregistrement…" : interaction ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}

export function InteractionTimeline({
  candidatId,
  interactions,
}: {
  candidatId: string;
  interactions: CandidatInteraction[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quickType, setQuickType] = useState<TypeInteraction>("autre");

  const sorted = [...interactions].sort((a, b) => (a.date_realisee < b.date_realisee ? 1 : -1));

  const quickActions: { type: TypeInteraction; label: string }[] = [
    { type: "appel", label: "📞 Appel" },
    { type: "email", label: "✉️ Envoi plaquette" },
    { type: "visio", label: "🖥️ Visio" },
    { type: "visite_siege", label: "🏢 Visite siège" },
    { type: "immersion_magasin", label: "🛍️ Immersion magasin" },
    { type: "visite_ville_candidat", label: "📍 Visite ville candidat" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {quickActions.map((qa) => (
          <button
            key={qa.type}
            type="button"
            onClick={() => { setQuickType(qa.type); setAdding(true); setEditingId(null); }}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            + {qa.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setQuickType("autre"); setAdding(true); setEditingId(null); }}
          className="text-xs text-zinc-500 hover:text-zinc-900 px-2"
        >
          + Autre échange
        </button>
      </div>

      {adding && (
        <InteractionForm candidatId={candidatId} defaultType={quickType} onDone={() => setAdding(false)} />
      )}

      {sorted.length === 0 && !adding && (
        <p className="text-sm text-zinc-400 py-2">Aucun échange enregistré pour le moment.</p>
      )}

      <ul className="space-y-2">
        {sorted.map((it) => {
          if (editingId === it.id) {
            return (
              <li key={it.id}>
                <InteractionForm candidatId={candidatId} interaction={it} onDone={() => setEditingId(null)} />
              </li>
            );
          }
          return (
            <li key={it.id} className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white p-3">
              <span className="text-lg leading-none mt-0.5">{TYPE_ICONS[it.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-900">
                    {TYPE_INTERACTION_LABELS[it.type]}
                  </span>
                  <span className="text-xs text-zinc-400">{formatDateTime(it.date_realisee)}</span>
                </div>
                {it.notes && <p className="mt-1 text-sm text-zinc-600 whitespace-pre-line">{it.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setEditingId(it.id); setAdding(false); }}
                  className="text-xs text-zinc-500 hover:text-zinc-900"
                >
                  Éditer
                </button>
                <button
                  type="button"
                  onClick={() => deleteInteraction(it.id, candidatId)}
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
