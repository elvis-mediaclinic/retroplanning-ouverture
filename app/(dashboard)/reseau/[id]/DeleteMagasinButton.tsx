"use client";

import { useTransition } from "react";
import { deleteMagasin } from "../actions";

export function DeleteMagasinButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Supprimer ce magasin du réseau ?")) return;
    startTransition(() => deleteMagasin(id));
  }

  return (
    <button type="button" onClick={handleDelete} disabled={pending} className="btn-danger text-sm">
      {pending ? "Suppression…" : "Supprimer"}
    </button>
  );
}
