"use client";

import { useActionState } from "react";

type SelectItem = { id: string; nom: string; prenom?: string };

type Props = {
  action: (
    state: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
  defaultValues?: Record<string, string | number | null | undefined>;
  villes: SelectItem[];
  candidats: SelectItem[];
  franchisees: SelectItem[];
  submitLabel?: string;
};

export function ProjetForm({
  action,
  defaultValues,
  villes,
  candidats,
  franchisees,
  submitLabel = "Enregistrer",
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Nom du projet <span className="text-red-500">*</span>
          </label>
          <input
            name="nom"
            required
            defaultValue={(defaultValues?.nom as string) ?? ""}
            placeholder="ex : Bayonne Centre, Urrugne Galerie…"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type_magasin"
            defaultValue={(defaultValues?.type_magasin as string) ?? "franchise"}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="franchise">Franchisé</option>
            <option value="integre">Intégré</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Format <span className="text-red-500">*</span>
          </label>
          <select
            name="format_magasin"
            defaultValue={(defaultValues?.format_magasin as string) ?? "classique"}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="classique">Magasin classique</option>
            <option value="galerie">Galerie (cellule)</option>
            <option value="centre_ville">Centre-ville</option>
            <option value="kiosque">Kiosque</option>
            <option value="shop_in_shop">Shop-in-shop</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Statut</label>
          <select
            name="statut"
            defaultValue={(defaultValues?.statut as string) ?? "prospection"}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="prospection">Prospection</option>
            <option value="en_cours">En cours</option>
            <option value="ouvert">Ouvert</option>
            <option value="suspendu">Suspendu</option>
            <option value="abandonne">Abandonné</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Date cible d&apos;ouverture
          </label>
          <input
            name="date_cible_ouverture"
            type="date"
            defaultValue={(defaultValues?.date_cible_ouverture as string) ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Ville</label>
          <select
            name="ville_id"
            defaultValue={(defaultValues?.ville_id as string) ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">— Pas encore définie —</option>
            {villes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Candidat franchisé</label>
          <select
            name="candidat_id"
            defaultValue={(defaultValues?.candidat_id as string) ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">— Pas encore défini —</option>
            {candidats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.prenom} {c.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Compte franchisé (accès app)
          </label>
          <select
            name="franchisee_id"
            defaultValue={(defaultValues?.franchisee_id as string) ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">— Non assigné —</option>
            {franchisees.map((f) => (
              <option key={f.id} value={f.id}>
                {f.prenom} {f.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Surface (m²)
          </label>
          <input
            name="surface_m2"
            type="number"
            min="0"
            defaultValue={(defaultValues?.surface_m2 as number) ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Lien dossier SharePoint
          </label>
          <input
            name="lien_sharepoint"
            type="url"
            defaultValue={(defaultValues?.lien_sharepoint as string) ?? ""}
            placeholder="https://…"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium text-zinc-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={(defaultValues?.notes as string) ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}
