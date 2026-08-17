"use client";

import { useActionState } from "react";
import dynamic from "next/dynamic";
import { saveConcept } from "./actions";
import type { Section } from "../villes/[id]/SectionsEditor";

const SectionsEditor = dynamic(
  () => import("../villes/[id]/SectionsEditor").then((m) => m.SectionsEditor),
  { ssr: false, loading: () => <div className="h-40 rounded-lg border border-zinc-200 bg-zinc-50 animate-pulse" /> }
);

export function ConceptEditor({ defaultSections }: { defaultSections?: Section[] }) {
  const [state, formAction, pending] = useActionState(saveConcept, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <SectionsEditor defaultSections={defaultSections} />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">Enregistré.</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
