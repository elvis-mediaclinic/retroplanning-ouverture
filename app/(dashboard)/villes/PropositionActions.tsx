"use client";

import { useTransition } from "react";
import { reviewPropositionVille } from "./actions";

export function PropositionActions({ villeId }: { villeId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => reviewPropositionVille(villeId, "valider"))}
        className="rounded-md border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
      >
        Valider
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => reviewPropositionVille(villeId, "refuser"))}
        className="rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        Refuser
      </button>
    </div>
  );
}
