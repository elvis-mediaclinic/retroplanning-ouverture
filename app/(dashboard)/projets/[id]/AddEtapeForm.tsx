"use client";

import { useActionState, useRef } from "react";
import { addEtape } from "./actions";
import type { MCUser, PhaseEtape } from "@/lib/types";
import { MultiSelect, type SelectOption } from "./MultiSelect";

export function AddEtapeForm({
  projetId,
  phase,
  mcUsers,
}: {
  projetId: string;
  phase: PhaseEtape;
  mcUsers: MCUser[];
}) {
  const action = addEtape.bind(null, projetId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const mcOptions: SelectOption[] = mcUsers.map((u) => ({
    value: u.id,
    label: `${u.prenom} ${u.nom}`,
  }));

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await formAction(fd);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-3 py-2 bg-zinc-50/50"
    >
      <input type="hidden" name="phase" value={phase} />
      <input
        name="nom"
        placeholder="Nouvelle étape…"
        required
        className="flex-1 min-w-40 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs placeholder:text-zinc-400"
      />
      <div className="w-48">
        <MultiSelect name="resp_mc" options={mcOptions} placeholder="Resp. MC…" />
      </div>
      <input
        name="resp_franchise"
        placeholder="Resp. franchisé…"
        className="w-36 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs placeholder:text-zinc-400"
      />
      <input
        name="resp_externe"
        placeholder="Externe…"
        className="w-32 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs placeholder:text-zinc-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
      >
        {pending ? "…" : "+ Ajouter"}
      </button>
      {state?.error && <span className="text-xs text-red-500">{state.error}</span>}
    </form>
  );
}
