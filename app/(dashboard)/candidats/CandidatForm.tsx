"use client";

import { useActionState } from "react";
import type { Candidat } from "@/lib/types";

type Ville = { id: string; nom: string };

type Props = {
  action: (state: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string } | undefined>;
  defaultValues?: Partial<Candidat>;
  villes?: Ville[];
  selectedVilleIds?: string[];
  submitLabel?: string;
};

export function CandidatForm({ action, defaultValues, villes = [], selectedVilleIds = [], submitLabel = "Enregistrer" }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            name="prenom"
            required
            defaultValue={defaultValues?.prenom ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            name="nom"
            required
            defaultValue={defaultValues?.nom ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaultValues?.email ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Téléphone</label>
          <input
            name="telephone"
            type="tel"
            defaultValue={defaultValues?.telephone ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Apport personnel (€)</label>
          <input
            name="apport_personnel"
            type="number"
            min="0"
            defaultValue={defaultValues?.apport_personnel ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Statut</label>
          <select
            name="statut"
            defaultValue={defaultValues?.statut ?? "prospect"}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="prospect">Prospect</option>
            <option value="en_evaluation">En évaluation</option>
            <option value="valide">Validé</option>
            <option value="signe">Signé</option>
            <option value="refuse">Refusé</option>
          </select>
        </div>

        {villes.length > 0 && (
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium text-zinc-700">Villes souhaitées</label>
            <div className="max-h-40 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 grid grid-cols-2 gap-y-1.5 gap-x-4">
              {villes.map((v) => (
                <label key={v.id} className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="ville_ids"
                    value={v.id}
                    defaultChecked={selectedVilleIds.includes(v.id)}
                    className="rounded border-zinc-300 text-brand accent-brand"
                  />
                  {v.nom}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium text-zinc-700">Zone souhaitée (libre)</label>
          <input
            name="zone_souhaitee"
            defaultValue={defaultValues?.zone_souhaitee ?? ""}
            placeholder="ex : Sud-Ouest, Bretagne…"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium text-zinc-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={defaultValues?.notes ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}
