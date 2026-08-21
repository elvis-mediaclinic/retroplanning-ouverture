"use client";

import { useActionState, useState, useId, useRef } from "react";
import { saveMagasin } from "./actions";
import { FranchiseModal } from "./FranchiseModal";
import { CodePostalAutocomplete } from "@/components/CodePostalAutocomplete";
import type { Magasin, Franchise } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/types";

type Props = {
  magasin?: Magasin;
  projetId?: string | null;
  projetNom?: string | null;
  franchises: Franchise[];
  siretActuel?: string | null;
};

export function MagasinForm({ magasin, projetId = null, projetNom, franchises: initialFranchises, siretActuel }: Props) {
  const action = saveMagasin.bind(null, magasin?.id ?? null, projetId);
  const [state, formAction, pending] = useActionState(action, undefined);

  const [type, setType] = useState<"integre" | "franchise">(magasin?.type ?? "franchise");
  const [archive, setArchive] = useState(magasin?.archive ?? false);
  const [franchises, setFranchises] = useState(initialFranchises);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState(magasin?.franchise_id ?? "");
  const [showModal, setShowModal] = useState(false);

  const archiveId = useId();
  const selectRef = useRef<HTMLSelectElement>(null);

  function handleFranchiseCreated(f: { id: string; nom: string }) {
    setFranchises((prev) => [...prev, f as Franchise].sort((a, b) => a.nom.localeCompare(b.nom)));
    setSelectedFranchiseId(f.id);
    setShowModal(false);
  }

  return (
    <>
      {showModal && (
        <FranchiseModal
          onCreated={handleFranchiseCreated}
          onClose={() => setShowModal(false)}
        />
      )}

      <form action={formAction} className="space-y-6">
        {/* Type de magasin */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Type de magasin</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="franchise"
                checked={type === "franchise"}
                onChange={() => setType("franchise")}
                className="accent-brand"
              />
              <span className="text-sm text-zinc-700">Franchisé</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="integre"
                checked={type === "integre"}
                onChange={() => setType("integre")}
                className="accent-brand"
              />
              <span className="text-sm text-zinc-700">Intégré (appartenant à Mediaclinic)</span>
            </label>
          </div>
        </div>

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

            {siretActuel !== undefined && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">SIRET</label>
                <input name="siret" type="text" defaultValue={siretActuel ?? ""} className="input w-full"
                  placeholder="14 chiffres" maxLength={14} />
                <p className="text-xs text-zinc-400">Les anciens SIRET (après cession) ne sont pas modifiables.</p>
              </div>
            )}

            <div className="sm:col-span-2 space-y-1">
              <label className="text-sm font-medium text-zinc-700">Adresse</label>
              <input name="adresse" type="text" defaultValue={magasin?.adresse ?? ""} className="input w-full" />
            </div>

            <CodePostalAutocomplete
              cpName="code_postal"
              cpDefaultValue={magasin?.code_postal ?? ""}
              villeName="ville"
              villeDefaultValue={magasin?.ville ?? ""}
            />

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

            {type === "franchise" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Date de signature du contrat</label>
                <input name="date_signature_contrat" type="date" defaultValue={magasin?.date_signature_contrat ?? ""} className="input w-full" />
              </div>
            )}

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

        {/* Franchisé — masqué pour un magasin intégré */}
        {type === "franchise" && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Franchisé</h2>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-xs text-brand hover:underline"
              >
                + Créer un nouveau franchisé
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Sélectionner un franchisé</label>
              <select
                ref={selectRef}
                name="franchise_id"
                value={selectedFranchiseId}
                onChange={(e) => setSelectedFranchiseId(e.target.value)}
                className="input w-full"
              >
                <option value="">— Aucun —</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>

            {franchises.length === 0 && (
              <p className="text-xs text-zinc-400">
                Aucun franchisé enregistré.{" "}
                <button type="button" onClick={() => setShowModal(true)} className="text-brand hover:underline">
                  Créez le premier
                </button>.
              </p>
            )}
          </div>
        )}

        {/* Archivage */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Statut du magasin</h2>
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
              Magasin fermé (archiver)
            </label>
          </div>
          {archive && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Date de fermeture</label>
              <input
                name="date_fermeture"
                type="date"
                defaultValue={magasin?.date_fermeture ?? ""}
                className="input w-48"
              />
            </div>
          )}
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Enregistrement…" : magasin ? "Mettre à jour" : "Créer le magasin"}
          </button>
          <a href="/reseau" className="btn-secondary">Annuler</a>
        </div>
      </form>
    </>
  );
}
