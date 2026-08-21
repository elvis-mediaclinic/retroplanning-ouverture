"use client";

import { useActionState, useState } from "react";
import { enregistrerCession } from "../actions";
import type { Magasin, Franchise, TypeCession } from "@/lib/types";

const TYPE_LABELS: Record<TypeCession, string> = {
  franchise_a_franchise: "Franchisé → Franchisé",
  integre_a_franchise:   "Intégré → Franchisé (MC cède)",
  franchise_a_integre:   "Franchisé → Intégré (MC reprend)",
};

type Props = {
  magasin: Magasin;
  franchises: Franchise[];
  siretActuel: string | null;
};

export function CessionModal({ magasin, franchises, siretActuel }: Props) {
  const [open, setOpen] = useState(false);
  const action = enregistrerCession.bind(null, magasin.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  const [type, setType] = useState<TypeCession>(
    magasin.type === "integre" ? "integre_a_franchise" : "franchise_a_franchise"
  );
  const [repreneurMode, setRepreneurMode] = useState<"existant" | "nouveau">("existant");
  const [dejaAppliquee, setDejaAppliquee] = useState(false);

  const cedantAuto = magasin.type === "franchise" ? magasin.franchise_id : null;
  const showCedant = type === "franchise_a_franchise";
  const showRepreneur = type !== "franchise_a_integre";

  // Fermer et réinitialiser si succès
  const success = state && !state.error && Object.keys(state).length > 0 ? false : null;
  if (success === false && open) setOpen(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm">
        Enregistrer une cession
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-zinc-900">Enregistrer une cession</h2>
              <button type="button" onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
            </div>

            <form action={formAction} className="px-6 py-5 space-y-5">

              {/* Type */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Type de cession *</label>
                <select
                  name="type_cession"
                  value={type}
                  onChange={(e) => setType(e.target.value as TypeCession)}
                  className="input w-full"
                >
                  {(Object.entries(TYPE_LABELS) as [TypeCession, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Date de cession *</label>
                <input name="date_cession" type="date" required className="input w-full" />
              </div>

              {/* Cédant (franchise → franchise seulement) */}
              {showCedant && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">Franchisé cédant</label>
                  <select name="franchise_cedant_id" defaultValue={cedantAuto ?? ""} className="input w-full">
                    <option value="">— Aucun —</option>
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
              )}
              {!showCedant && <input type="hidden" name="franchise_cedant_id" value={cedantAuto ?? ""} />}

              {/* Repreneur */}
              {showRepreneur && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Franchisé repreneur *</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-700">
                      <input type="radio" value="existant" checked={repreneurMode === "existant"}
                        onChange={() => setRepreneurMode("existant")} className="accent-brand" />
                      Franchisé existant
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-700">
                      <input type="radio" value="nouveau" checked={repreneurMode === "nouveau"}
                        onChange={() => setRepreneurMode("nouveau")} className="accent-brand" />
                      Nouveau franchisé
                    </label>
                  </div>

                  {repreneurMode === "existant" ? (
                    <select name="franchise_repreneur_id" className="input w-full">
                      <option value="">— Sélectionner —</option>
                      {franchises.map((f) => (
                        <option key={f.id} value={f.id}>{f.nom}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="nouveau_franchise_nom"
                      type="text"
                      placeholder="Nom du nouveau franchisé"
                      className="input w-full"
                    />
                  )}
                </div>
              )}

              {/* Nouveau SIRET */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Nouveau SIRET
                  {siretActuel && (
                    <span className="ml-2 text-xs font-normal text-zinc-400">Actuel : {siretActuel}</span>
                  )}
                </label>
                <input name="nouveau_siret" type="text" placeholder="Laisser vide si inchangé ou inconnu"
                  maxLength={14} className="input w-full" />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Notes</label>
                <textarea name="notes" rows={2} className="input w-full resize-none"
                  placeholder="Conditions, remarques…" />
              </div>

              {/* Cession historique */}
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="hidden" name="deja_appliquee" value="0" />
                  <input
                    type="checkbox"
                    name="deja_appliquee"
                    value="1"
                    checked={dejaAppliquee}
                    onChange={(e) => setDejaAppliquee(e.target.checked)}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="text-sm font-medium text-amber-800">Cession déjà appliquée</span>
                </label>
                <p className="text-xs text-amber-700 pl-6">
                  Cocher pour enregistrer un événement passé sans modifier l&apos;état actuel du magasin.
                </p>
              </div>

              {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Annuler</button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? "Enregistrement…" : "Enregistrer la cession"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
