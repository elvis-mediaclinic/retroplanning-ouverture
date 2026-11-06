"use client";

import { useActionState, useState } from "react";
import dynamic from "next/dynamic";
import { saveConcept } from "./actions";
import type { Section } from "../villes/[id]/SectionsEditor";

const SectionsEditor = dynamic(
  () => import("../villes/[id]/SectionsEditor").then((m) => m.SectionsEditor),
  { ssr: false, loading: () => <div className="h-40 rounded-lg border border-zinc-200 bg-zinc-50 animate-pulse" /> }
);

const TitreInput = dynamic(
  () => import("../villes/[id]/SectionsEditor").then((m) => m.TitreInput),
  { ssr: false }
);

export function ConceptEditor({
  defaultSections,
  defaultTitre,
}: {
  defaultSections?: Section[];
  defaultTitre?: string;
}) {
  const [state, formAction, pending] = useActionState(saveConcept, undefined);
  const [titre, setTitre] = useState(defaultTitre ?? "");

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Titre de la page (affiché en haut de « La franchise »)
        </label>
        <TitreInput
          name="titre"
          value={titre}
          onChange={setTitre}
          placeholder="La franchise Mediaclinic"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <SectionsEditor defaultSections={defaultSections} annonceToggle />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">Enregistré.</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
