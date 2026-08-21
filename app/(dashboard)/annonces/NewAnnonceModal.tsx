"use client";

import { useState, useTransition } from "react";
import { createAnnonce } from "./actions";

type Ville = { id: string; nom: string; departement?: string | null };

export function NewAnnonceModal({ villes }: { villes: Ville[] }) {
  const [open, setOpen] = useState(false);
  const [villeId, setVilleId] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!villeId) return;
    setError(undefined);
    startTransition(async () => {
      try {
        await createAnnonce(villeId);
      } catch {
        setError("Une erreur est survenue.");
      }
    });
  }

  if (villes.length === 0) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary text-sm">
        + Créer une annonce
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-zinc-900">Nouvelle annonce</h2>
              <button type="button" onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Ville *
                </label>
                <select
                  value={villeId}
                  onChange={(e) => setVilleId(e.target.value)}
                  required
                  className="input w-full"
                >
                  <option value="">— Sélectionner une ville —</option>
                  {villes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nom}{v.departement ? ` (${v.departement})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-zinc-400">
                  Seules les villes sans annonce existante sont listées.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={pending || !villeId} className="btn-primary">
                  {pending ? "Création…" : "Créer et éditer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
