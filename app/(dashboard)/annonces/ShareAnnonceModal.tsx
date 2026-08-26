"use client";

import { useActionState, useState } from "react";
import { setAnnonceConsultants, type ShareState } from "./share-actions";

type Consultant = { id: string; prenom: string; nom: string };

export function ShareAnnonceModal({
  annonceId,
  consultants,
  sharedWith,
}: {
  annonceId: string;
  consultants: Consultant[];
  sharedWith: string[];
}) {
  const [open, setOpen] = useState(false);
  const action = setAnnonceConsultants.bind(null, annonceId);
  const [state, formAction, pending] = useActionState<ShareState, FormData>(action, undefined);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="text-xs text-zinc-500 hover:text-zinc-900"
      >
        {sharedWith.length > 0
          ? `Partagée · ${sharedWith.length} consultant${sharedWith.length > 1 ? "s" : ""}`
          : "Partager"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200">
              <h2 className="text-sm font-semibold text-zinc-900">Partager avec des consultants</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">×</button>
            </div>
            <form
              action={async (fd) => {
                await formAction(fd);
                setOpen(false);
              }}
              className="px-5 py-4 space-y-4"
            >
              {consultants.length === 0 ? (
                <p className="text-sm text-zinc-400">Aucun compte consultant pour l&apos;instant.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {consultants.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="consultant_ids"
                        value={c.id}
                        defaultChecked={sharedWith.includes(c.id)}
                        className="rounded border-zinc-300 text-brand accent-brand"
                      />
                      {c.prenom} {c.nom}
                    </label>
                  ))}
                </div>
              )}
              {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-xs px-3 py-1.5">
                  Annuler
                </button>
                <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
