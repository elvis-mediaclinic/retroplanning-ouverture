"use client";

import { useActionState, useState, useId } from "react";
import { saveFranchise } from "../actions";
import type { Franchise, FranchiseAsssocie } from "@/lib/types";

const EMPTY: FranchiseAsssocie = { prenom: "", nom: "", telephone: "", email: "" };

type Props = { franchise?: Franchise };

export function FranchiseForm({ franchise }: Props) {
  const action = saveFranchise.bind(null, franchise?.id ?? null);
  const [state, formAction, pending] = useActionState(action, undefined);

  const [archive, setArchive] = useState(franchise?.archive ?? false);
  const archiveId = useId();
  const [associes, setAssocies] = useState<FranchiseAsssocie[]>(
    franchise?.associes?.length ? franchise.associes : [{ ...EMPTY }]
  );

  function add() { setAssocies((p) => [...p, { ...EMPTY }]); }
  function remove(i: number) { setAssocies((p) => p.filter((_, idx) => idx !== i)); }
  function update(i: number, field: keyof FranchiseAsssocie, value: string) {
    setAssocies((p) => p.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Informations</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Nom du franchisé / groupe *</label>
          <input name="nom" type="text" required defaultValue={franchise?.nom} className="input w-full"
            placeholder="Ex : Famille Martin, SAS Dupont..." />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Raison sociale</label>
            <input name="raison_sociale" type="text" defaultValue={franchise?.raison_sociale ?? ""} className="input w-full" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">SIREN</label>
            <input name="siren" type="text" defaultValue={franchise?.siren ?? ""} className="input w-full" placeholder="9 chiffres" maxLength={9} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">RCS</label>
            <input name="rcs" type="text" defaultValue={franchise?.rcs ?? ""} className="input w-full" placeholder="Ex : RCS Paris B 123 456 789" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">TVA intracommunautaire</label>
            <input name="tva_intracom" type="text" defaultValue={franchise?.tva_intracom ?? ""} className="input w-full" placeholder="Ex : FR12345678901" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Notes</label>
          <textarea name="notes" rows={2} defaultValue={franchise?.notes ?? ""} className="input w-full resize-none" />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Personnes / Associés</h2>
          <button type="button" onClick={add} className="text-xs text-brand hover:underline">
            + Ajouter un associé
          </button>
        </div>

        {associes.map((a, i) => (
          <div key={i} className="border border-zinc-100 rounded-lg p-4 space-y-3 relative">
            {associes.length > 1 && (
              <button type="button" onClick={() => remove(i)}
                className="absolute top-3 right-3 text-xs text-red-400 hover:text-red-600">
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

      {/* Archivage */}
      {franchise && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900">Statut du franchisé</h2>
          <div className="flex items-center gap-3">
            <input type="hidden" name="archive" value="0" />
            <input
              id={archiveId}
              type="checkbox"
              name="archive"
              value="1"
              checked={archive}
              onChange={(e) => setArchive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-brand"
            />
            <label htmlFor={archiveId} className="text-sm text-zinc-700 cursor-pointer">
              Franchisé inactif (archiver)
            </label>
          </div>
          {archive && (
            <p className="text-xs text-zinc-400 ml-7">
              Les magasins liés ne sont pas archivés automatiquement. Le franchisé peut être désarchivé à tout moment.
            </p>
          )}
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Enregistrement…" : franchise ? "Mettre à jour" : "Créer le franchisé"}
        </button>
        <a href="/reseau/franchises" className="btn-secondary">Annuler</a>
      </div>
    </form>
  );
}
