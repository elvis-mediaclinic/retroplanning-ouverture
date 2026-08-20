"use client";

import { useActionState, useRef } from "react";
import { addEtape } from "./actions";
import type { PhaseEtape } from "@/lib/types";

export function AddEtapeForm({ projetId, phase }: { projetId: string; phase: PhaseEtape }) {
  const action = addEtape.bind(null, projetId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await formAction(fd);
        formRef.current?.reset();
      }}
      className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2 bg-zinc-50/50"
    >
      <input type="hidden" name="phase" value={phase} />
      <input
        name="nom"
        placeholder="Nouvelle étape…"
        required
        className="flex-1 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs placeholder:text-zinc-400"
      />
      <select
        name="responsable"
        defaultValue="franchise"
        className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600"
      >
        <option value="mc">Nous</option>
        <option value="franchise">Franchisé</option>
        <option value="les_deux">Les deux</option>
        <option value="externe">Externe</option>
      </select>
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
