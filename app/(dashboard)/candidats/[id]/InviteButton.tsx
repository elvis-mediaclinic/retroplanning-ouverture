"use client";

import { useState, useTransition } from "react";

export function InviteButton({
  action,
}: {
  action: () => Promise<{ error?: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string } | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await action();
      setResult(res);
    });
  }

  if (result && !result.error) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        ✓ Invitation envoyée
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? "Envoi…" : "Inviter ce candidat"}
      </button>
      {result?.error && (
        <p className="text-xs text-red-600">{result.error}</p>
      )}
    </div>
  );
}
