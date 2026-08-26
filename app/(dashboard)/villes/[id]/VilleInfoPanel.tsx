"use client";

import { useState } from "react";
import { VilleForm } from "../VilleForm";
import { STATUT_VILLE_LABELS, type Ville } from "@/lib/types";

type VilleAction = (state: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string } | undefined>;

export function VilleInfoPanel({
  ville,
  action,
  canEdit,
}: {
  ville: Ville;
  action: VilleAction;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (canEdit && editing) {
    return (
      <div className="space-y-3">
        <VilleForm action={action} defaultValues={ville} />
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-zinc-900">
          ← Revenir à l'affichage
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">{ville.nom}</h2>
        {canEdit && (
          <button type="button" onClick={() => setEditing(true)} className="btn-secondary text-sm">
            Modifier
          </button>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
        {[
          { label: "Département", value: ville.departement ?? "—" },
          { label: "Région", value: ville.region ?? "—" },
          { label: "Zone de chalandise", value: ville.zone_chalandise ?? "—" },
          { label: "Statut", value: STATUT_VILLE_LABELS[ville.statut as keyof typeof STATUT_VILLE_LABELS] },
        ].map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-zinc-400 mb-0.5">{label}</dt>
            <dd className="font-medium text-zinc-900">{value}</dd>
          </div>
        ))}
        {ville.notes && (
          <div className="col-span-full">
            <dt className="text-xs text-zinc-400 mb-0.5">Notes</dt>
            <dd className="text-zinc-600 whitespace-pre-line">{ville.notes}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
