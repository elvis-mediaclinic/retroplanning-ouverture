"use client";

import { useActionState, useState } from "react";
import { saveMagasin } from "./actions";
import type { Magasin, FranchiseAsssocie } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/types";

type Props = {
  magasin?: Magasin;
  projetId?: string | null;
  projetNom?: string | null;
};

const EMPTY_ASSOCIE: FranchiseAsssocie = { prenom: "", nom: "", telephone: "", email: "" };

export function MagasinForm({ magasin, projetId = null, projetNom }: Props) {
  const action = saveMagasin.bind(null, magasin?.id ?? null, projetId);
  const [state, formAction, pending] = useActionState(action, undefined);

  const [associes, setAssocies] = useState<FranchiseAsssocie[]>(
    magasin?.franchises?.length ? magasin.franchises : [{ ...EMPTY_ASSOCIE }]
  );

  function addAssocie() {
    setAssocies((prev) => [...prev, { ...EMPTY_ASSOCIE }]);
  }

  function removeAssocie(i: number) {
    setAssocies((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateAssocie(i: number, field: keyof FranchiseAsssocie, value: string) {
    setAssocies((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Infos magasin */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Informations du magasin</h2>

        {projetNom && (
          <p className="text-xs text-zinc-500 bg-zinc-50 rounded px-3 py-2">
            Lié au projet : <strong>{projetNom}</strong>
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-sm font-medium text-zinc-700">Nom du magasin *</label>
            <input name="nom" type="text" required defaultValue={magasin?.nom} className="input w-full" />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-sm font-medium text-zinc-700">Adresse</label>
            <input name="adresse" type="text" defaultValue={magasin?.adresse ?? ""} className="input w-full" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Code postal</label>
            <input name="code_postal" type="text" defaultValue={magasin?.code_postal ?? ""} className="input w-full" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Ville</label>
            <input name="ville" type="text" defaultValue={magasin?.ville ?? ""} className="input w-full" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Téléphone</label>
            <input name="telephone" type="tel" defaultValue={magasin?.telephone ?? ""} className="input w-full" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Email</label>
            <input name="email" type="email" defaultValue={magasin?.email ?? ""} className="input w-full" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Format</label>
            <select name="format" defaultValue={magasin?.format ?? ""} className="input w-full">
              <option value="">—</option>
              {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Surface (m²)</label>
            <input name="surface_m2" type="number" min={0} defaultValue={magasin?.surface_m2 ?? ""} className="input w-full" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Date de signature du contrat</label>
            <input name="date_signature_contrat" type="date" defaultValue={magasin?.date_signature_contrat ?? ""} className="input w-full" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Date d'ouverture</label>
            <input name="date_ouverture" type="date" defaultValue={magasin?.date_ouverture ?? ""} className="input w-full" />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-sm font-medium text-zinc-700">Notes</label>
            <textarea name="notes" rows={3} defaultValue={magasin?.notes ?? ""} className="input w-full resize-none" />
          </div>
        </div>
      </div>

      {/* Associés / franchisés */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Franchisé(s) / Associé(s)</h2>
          <button type="button" onClick={addAssocie} className="text-xs text-brand hover:underline">
            + Ajouter un associé
          </button>
        </div>

        {associes.map((a, i) => (
          <div key={i} className="border border-zinc-100 rounded-lg p-4 space-y-3 relative">
            {associes.length > 1 && (
              <button
                type="button"
                onClick={() => removeAssocie(i)}
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
                <input
                  name={`franchises[${i}][prenom]`}
                  type="text"
                  value={a.prenom}
                  onChange={(e) => updateAssocie(i, "prenom", e.target.value)}
                  className="input w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Nom</label>
                <input
                  name={`franchises[${i}][nom]`}
                  type="text"
                  value={a.nom}
                  onChange={(e) => updateAssocie(i, "nom", e.target.value)}
                  className="input w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Téléphone</label>
                <input
                  name={`franchises[${i}][telephone]`}
                  type="tel"
                  value={a.telephone}
                  onChange={(e) => updateAssocie(i, "telephone", e.target.value)}
                  className="input w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Email</label>
                <input
                  name={`franchises[${i}][email]`}
                  type="email"
                  value={a.email}
                  onChange={(e) => updateAssocie(i, "email", e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Enregistrement…" : magasin ? "Mettre à jour" : "Créer le magasin"}
        </button>
        <a href="/reseau" className="btn-secondary">Annuler</a>
      </div>
    </form>
  );
}
