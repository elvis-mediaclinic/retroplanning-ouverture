"use client";

import { useActionState } from "react";
import { submitCandidature } from "./actions";

export function CandidatureForm({
  annonceId,
  villeId,
  magasinId,
  consultantId,
}: {
  annonceId: string;
  villeId: string;
  magasinId?: string;
  consultantId?: string;
}) {
  const action = submitCandidature.bind(null, annonceId, villeId, magasinId ?? "", consultantId ?? "");
  const [state, formAction, pending] = useActionState(action, undefined);

  const fieldCls =
    "w-full rounded-lg border border-[#D0D5DD] px-4 py-3 text-sm text-[#1D1D1D] shadow-[0_1px_2px_rgba(16,24,40,0.05)] focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
  const labelCls = "text-sm font-medium text-[#344054]";

  if (state?.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-800">Candidature envoyée !</p>
        <p className="mt-1 text-sm text-green-700">
          L&apos;équipe Mediaclinic vous contactera dans les prochains jours.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Ligne 1 : Prénom · Nom · Email · Téléphone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className={labelCls}>
            Prénom <span className="text-red-500">*</span>
          </label>
          <input name="prenom" required autoComplete="given-name" className={fieldCls} />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>
            Nom <span className="text-red-500">*</span>
          </label>
          <input name="nom" required autoComplete="family-name" className={fieldCls} />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>
            Email <span className="text-red-500">*</span>
          </label>
          <input name="email" type="email" required autoComplete="email" className={fieldCls} />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>Téléphone</label>
          <input name="telephone" type="tel" autoComplete="tel" className={fieldCls} />
        </div>
      </div>

      {/* Ligne 2 : Message */}
      <div className="space-y-2">
        <label className={labelCls}>
          Message
          <span className="ml-1 text-xs text-zinc-400">optionnel</span>
        </label>
        <textarea
          name="message"
          rows={4}
          placeholder="Parlez-nous de votre parcours, vos motivations…"
          className={fieldCls}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand px-8 py-4 text-lg font-bold text-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-brand-dark disabled:opacity-50 transition-colors"
      >
        {pending ? "Envoi…" : "Envoyer ma candidature"}
      </button>
    </form>
  );
}
