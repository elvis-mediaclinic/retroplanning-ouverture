"use client";

import { useState, useTransition } from "react";
import { updateUser } from "./actions";

const ROLE_OPTIONS = [
  { value: "franchise", label: "Franchisé" },
  { value: "responsable_mc", label: "Responsable MC" },
  { value: "consultant", label: "Consultant" },
  { value: "admin", label: "Admin" },
];

export function EditUserForm({
  profile,
}: {
  profile: { id: string; role: string; fonction: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const result = await updateUser(profile.id, fd);
      if (result?.error) setMsg(result.error);
      else { setMsg(null); setOpen(false); }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-400 hover:text-zinc-700 underline"
      >
        Modifier
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        name="role"
        defaultValue={profile.role}
        className="rounded border border-zinc-300 px-2 py-1 text-xs"
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input
        name="fonction"
        defaultValue={profile.fonction ?? ""}
        placeholder="Fonction…"
        className="rounded border border-zinc-300 px-2 py-1 text-xs w-36"
      />
      <button type="submit" disabled={pending} className="text-xs text-indigo-600 hover:underline">
        {pending ? "…" : "OK"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-zinc-400 hover:underline">
        ×
      </button>
      {msg && <span className="text-xs text-red-500">{msg}</span>}
    </form>
  );
}
