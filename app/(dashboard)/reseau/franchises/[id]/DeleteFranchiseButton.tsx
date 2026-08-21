"use client";

import { useTransition } from "react";
import { deleteFranchise } from "../../actions";

export function DeleteFranchiseButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Supprimer ce franchisé ? Les magasins liés ne seront pas supprimés.")) return;
    startTransition(() => deleteFranchise(id));
  }

  return (
    <button type="button" onClick={handleDelete} disabled={pending} className="btn-danger text-sm">
      {pending ? "Suppression…" : "Supprimer"}
    </button>
  );
}
