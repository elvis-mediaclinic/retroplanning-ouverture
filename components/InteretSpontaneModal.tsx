"use client";

import { useActionState, useState } from "react";
import { VilleAutocomplete } from "@/components/VilleAutocomplete";
import { submitInteretSpontane, type InteretSpontaneState } from "@/app/opportunites/actions";

// Modale de candidature spontanée ("je veux devenir franchisé, quelle que soit
// la ville") — réutilisée depuis la liste des opportunités et le bouton
// "Devenir franchisé" du navbar sur les pages qui n'ont pas déjà de
// formulaire lié à une ville précise (contrairement à une page annonce).
export function InteretSpontaneModal({
  triggerLabel,
  triggerClassName,
}: {
  triggerLabel: string;
  triggerClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<InteretSpontaneState, FormData>(submitInteretSpontane, undefined);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-zinc-900">
                {state?.success ? "Merci !" : "Devenir franchisé Mediaclinic"}
              </h2>
              <button type="button" onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5">
              {state?.success ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Votre demande a bien été enregistrée. L&apos;équipe Mediaclinic reviendra vers vous rapidement.
                  </p>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <form action={formAction} className="space-y-4">
                  <p className="text-sm text-zinc-500">
                    Laissez-nous vos coordonnées et la ville qui vous intéresse, nous étudierons votre demande
                    même si aucune opportunité n&apos;y est encore publiée.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-zinc-700">Prénom</label>
                      <input name="prenom" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-zinc-700">Nom</label>
                      <input name="nom" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-zinc-700">Email</label>
                      <input name="email" type="email" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-zinc-700">Téléphone</label>
                      <input name="telephone" type="tel" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <VilleAutocomplete
                      villeName="ville"
                      villeLabel="Ville souhaitée *"
                      departementName="departement"
                      regionName="region"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">Message (optionnel)</label>
                    <textarea name="message" rows={3} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm resize-none" />
                  </div>

                  {state?.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Annuler</button>
                    <button type="submit" disabled={pending} className="btn-primary">
                      {pending ? "Envoi…" : "Envoyer"}
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
