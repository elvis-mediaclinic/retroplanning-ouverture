"use client";

import { useState, useTransition } from "react";
import { PHASE_LABELS } from "@/lib/types";
import { updateEtapeTemplate, addEtapeTemplate, deleteEtapeTemplate } from "./actions";

type Etape = { id: string; phase: string; nom: string; ordre: number };

const PHASES_ORDER = [
  "administratif_financement",
  "communication",
  "ressources_humaines",
  "travaux_amenagement",
  "formation",
  "stock_fournisseurs",
  "ouverture",
] as const;

function EtapeRow({ etape }: { etape: Etape }) {
  const [editing, setEditing] = useState(false);
  const [nom, setNom] = useState(etape.nom);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!nom.trim() || nom.trim() === etape.nom) { setEditing(false); return; }
    startTransition(async () => {
      await updateEtapeTemplate(etape.id, nom);
      setEditing(false);
    });
  }

  function remove() {
    if (!confirm(`Supprimer "${etape.nom}" ?`)) return;
    startTransition(() => deleteEtapeTemplate(etape.id));
  }

  return (
    <tr className="group hover:bg-zinc-50">
      <td className="px-4 py-2 text-zinc-400 w-8 text-right tabular-nums text-sm">{etape.ordre}</td>
      <td className="px-3 py-1.5">
        {editing ? (
          <div className="flex gap-2 items-center">
            <input
              autoFocus
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus:border-brand focus:outline-none"
            />
            <button type="button" onClick={save} disabled={pending} className="text-xs text-brand font-medium hover:underline">
              {pending ? "…" : "OK"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-zinc-400 hover:text-zinc-600">
              Annuler
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-900 flex-1">{etape.nom}</span>
            <div className="hidden group-hover:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100"
              >
                Renommer
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

function AddEtapeRow({ phase }: { phase: string }) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit() {
    if (!nom.trim()) return;
    setError("");
    startTransition(async () => {
      const res = await addEtapeTemplate(phase, nom);
      if (res?.error) { setError(res.error); return; }
      setNom("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <tr>
        <td />
        <td className="px-3 py-1.5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs text-zinc-400 hover:text-brand hover:underline"
          >
            + Ajouter une étape
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-zinc-50">
      <td />
      <td className="px-3 py-1.5">
        <div className="flex gap-2 items-center">
          <input
            autoFocus
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
            placeholder="Nom de l'étape…"
            className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus:border-brand focus:outline-none"
          />
          <button type="button" onClick={submit} disabled={pending} className="text-xs text-brand font-medium hover:underline">
            {pending ? "…" : "Ajouter"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-zinc-400 hover:text-zinc-600">
            Annuler
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </td>
    </tr>
  );
}

export function TemplateEditor({ etapes }: { etapes: Etape[] }) {
  return (
    <div className="space-y-4">
      {PHASES_ORDER.map((phase) => {
        const rows = etapes
          .filter((e) => e.phase === phase)
          .sort((a, b) => a.ordre - b.ordre);

        return (
          <div key={phase} className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {PHASE_LABELS[phase as keyof typeof PHASE_LABELS]}
              </p>
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-zinc-100">
                {rows.map((e) => <EtapeRow key={e.id} etape={e} />)}
                <AddEtapeRow phase={phase} />
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
