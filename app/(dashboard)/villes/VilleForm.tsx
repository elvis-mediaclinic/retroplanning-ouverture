"use client";

import { useActionState } from "react";
import type { Ville } from "@/lib/types";

type Props = {
  action: (state: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string } | undefined>;
  defaultValues?: Partial<Ville>;
  submitLabel?: string;
};

export function VilleForm({ action, defaultValues, submitLabel = "Enregistrer" }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Nom de la ville <span className="text-red-500">*</span>
          </label>
          <input
            name="nom"
            required
            defaultValue={defaultValues?.nom ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Département</label>
          <input
            name="departement"
            defaultValue={defaultValues?.departement ?? ""}
            placeholder="ex : 64"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Région</label>
          <input
            name="region"
            defaultValue={defaultValues?.region ?? ""}
            placeholder="ex : Nouvelle-Aquitaine"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Population</label>
          <input
            name="population"
            type="number"
            defaultValue={defaultValues?.population ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Statut</label>
          <select
            name="statut"
            defaultValue={defaultValues?.statut ?? "en_etude"}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="en_etude">En étude</option>
            <option value="validee">Validée</option>
            <option value="abandonnee">Abandonnée</option>
          </select>
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

      <button
        type="submit"
        disabled={pending}
        className="btn-primary"
      >
        {pending ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}
