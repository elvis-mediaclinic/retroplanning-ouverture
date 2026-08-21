"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createFranchiseInline } from "./actions";
import type { FranchiseAsssocie } from "@/lib/types";

const EMPTY: FranchiseAsssocie = { prenom: "", nom: "", telephone: "", email: "" };

type Props = {
  onCreated: (franchise: { id: string; nom: string }) => void;
  onClose: () => void;
};

export function FranchiseModal({ onCreated, onClose }: Props) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [associes, setAssocies] = useState<FranchiseAsssocie[]>([{ ...EMPTY }]);
  const formRef = useRef<HTMLFormElement>(null);

  // Fermer sur Échap
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(undefined);
    startTransition(async () => {
      const result = await createFranchiseInline(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        onCreated(result);
      }
    });
  }

  function add() { setAssocies((p) => [...p, { ...EMPTY }]); }
  function remove(i: number) { setAssocies((p) => p.filter((_, idx) => idx !== i)); }
  function update(i: number, field: keyof FranchiseAsssocie, value: string) {
    setAssocies((p) => p.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">Nouveau franchisé</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 text-xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Corps */}
        <form ref={formRef} onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">
                Nom du franchisé / groupe *
              </label>
              <input
                name="nom"
                type="text"
                required
                autoFocus
                className="input w-full"
                placeholder="Ex : Famille Martin, SAS Dupont…"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-700">Personnes / Associés</p>
                <button type="button" onClick={add} className="text-xs text-brand hover:underline">
                  + Ajouter
                </button>
              </div>

              {associes.map((a, i) => (
                <div key={i} className="border border-zinc-100 rounded-lg p-4 space-y-3 relative bg-zinc-50">
                  {associes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="absolute top-3 right-3 text-xs text-red-400 hover:text-red-600"
                    >
                      Supprimer
                    </button>
                  )}
                  <p className="text-xs font-medium text-zinc-500">
                    {i === 0 ? "Franchisé principal" : `Associé ${i + 1}`}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-600">Prénom</label>
                      <input name={`associes[${i}][prenom]`} type="text" value={a.prenom}
                        onChange={(e) => update(i, "prenom", e.target.value)} className="input w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-600">Nom</label>
                      <input name={`associes[${i}][nom]`} type="text" value={a.nom}
                        onChange={(e) => update(i, "nom", e.target.value)} className="input w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-600">Téléphone</label>
                      <input name={`associes[${i}][telephone]`} type="tel" value={a.telephone}
                        onChange={(e) => update(i, "telephone", e.target.value)} className="input w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-600">Email</label>
                      <input name={`associes[${i}][email]`} type="email" value={a.email}
                        onChange={(e) => update(i, "email", e.target.value)} className="input w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Création…" : "Créer le franchisé"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
