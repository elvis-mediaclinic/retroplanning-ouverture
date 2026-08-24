"use client";

import { useActionState, useState } from "react";
import { createUser } from "./actions";

export function CreateUserModal() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createUser, undefined);
  const [role, setRole] = useState("franchise");
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!state?.inviteLink) return;
    navigator.clipboard.writeText(state.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-white px-3 py-2 text-sm font-medium text-[#00729e] hover:bg-white/90 transition-colors"
      >
        + Ajouter un utilisateur
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-zinc-900">
                {state?.personName ? "Compte créé" : "Créer un compte"}
              </h2>
              <button type="button" onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5">
              {state?.personName ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Invitation envoyée à <strong>{state.personName}</strong>
                  </p>
                  <p className="text-xs text-green-700">{state.success}</p>
                  {state.inviteLink && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-zinc-700">
                        Lien d&apos;activation (secours)
                      </p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={state.inviteLink}
                          className="flex-1 min-w-0 rounded-md border border-zinc-300 px-3 py-2 text-xs text-zinc-500 bg-white font-mono truncate"
                        />
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          {copied ? "✓ Copié !" : "Copier"}
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Usage unique · expire après le clic · la personne choisira son mot de passe
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end pt-1">
                    <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <form action={action} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="prenom" className="text-sm font-medium text-zinc-700">Prénom</label>
                      <input id="prenom" name="prenom" type="text" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="nom" className="text-sm font-medium text-zinc-700">Nom</label>
                      <input id="nom" name="nom" type="text" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</label>
                      <input id="email" name="email" type="email" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="telephone" className="text-sm font-medium text-zinc-700">Téléphone</label>
                      <input id="telephone" name="telephone" type="tel" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="role" className="text-sm font-medium text-zinc-700">Rôle</label>
                      <select
                        id="role"
                        name="role"
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                      >
                        <option value="franchise">Franchisé</option>
                        <option value="responsable_mc">Responsable MC</option>
                        <option value="consultant">Consultant</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {(role === "admin" || role === "responsable_mc") && (
                      <div className="space-y-1">
                        <label htmlFor="fonction" className="text-sm font-medium text-zinc-700">Fonction</label>
                        <input
                          id="fonction"
                          name="fonction"
                          type="text"
                          placeholder="ex : Développeur franchise, DAF…"
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                        />
                      </div>
                    )}
                  </div>

                  {state?.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Annuler</button>
                    <button type="submit" disabled={pending} className="btn-primary">
                      {pending ? "Création…" : "Créer le compte"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
