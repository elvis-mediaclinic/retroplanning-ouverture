"use client";

import { useActionState } from "react";
import { submitCandidature } from "./actions";

export function CandidatureForm({
  annonceId,
  villeId,
  magasinId,
}: {
  annonceId: string;
  villeId: string;
  magasinId?: string;
}) {
  const action = submitCandidature.bind(null, annonceId, villeId, magasinId ?? "");
  const [state, formAction, pending] = useActionState(action, undefined);

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
    <form action={formAction} className="space-y-4">
      {/* Ligne 1 : Prénom · Nom · Email · Téléphone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            name="prenom"
            required
            autoComplete="given-name"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            name="nom"
            required
            autoComplete="family-name"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Téléphone</label>
          <input
            name="telephone"
            type="tel"
            autoComplete="tel"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Ligne 2 : Message */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-700">
          Message
          <span className="ml-1 text-xs text-zinc-400">optionnel</span>
        </label>
        <textarea
          name="message"
          rows={3}
          placeholder="Parlez-nous de votre parcours, vos motivations…"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Envoi…" : "Envoyer ma candidature"}
      </button>
    </form>
  );
}
