"use client";

import { useState, useTransition } from "react";
import { inviterFranchise } from "./actions";

export function InviteButton({ projetId }: { projetId: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function handleClick() {
    setMsg(null);
    startTransition(async () => {
      const result = await inviterFranchise(projetId);
      if (result.success) setMsg({ type: "ok", text: result.success });
      else if (result.error) setMsg({ type: "err", text: result.error });
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
      >
        {pending ? "Envoi…" : "✉ Inviter le franchisé"}
      </button>
      {msg && (
        <div className={`absolute right-0 top-full mt-1 z-20 rounded-md border px-3 py-2 text-xs whitespace-nowrap shadow-md bg-white ${
          msg.type === "ok" ? "border-green-200 text-green-700" : "border-red-200 text-red-700"
        }`}>
          {msg.text}
          <button
            type="button"
            onClick={() => setMsg(null)}
            className="ml-2 text-zinc-400 hover:text-zinc-600"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
