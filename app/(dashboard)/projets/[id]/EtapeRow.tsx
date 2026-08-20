"use client";

import { useActionState } from "react";
import { updateEtape } from "./actions";
import type { EtapeProjet, StatutEtape } from "@/lib/types";
import { STATUT_ETAPE_LABELS } from "@/lib/types";
import {
  STATUT_ETAPE_COLORS,
  RESP_COLORS,
  RESP_LABELS,
  formatDate,
} from "@/lib/utils";

export function EtapeRow({
  etape,
  projetId,
  canEdit,
}: {
  etape: EtapeProjet;
  projetId: string;
  canEdit: boolean;
}) {
  const action = updateEtape.bind(null, etape.id, projetId);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-md px-3 py-2.5 hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
        {/* Statut badge / quick select */}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            STATUT_ETAPE_COLORS[etape.statut as StatutEtape]
          }`}
        >
          {STATUT_ETAPE_LABELS[etape.statut as StatutEtape]}
        </span>

        {/* Nom */}
        <span className="flex-1 text-sm text-zinc-800">{etape.nom}</span>

        {/* Responsable */}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            RESP_COLORS[etape.responsable]
          }`}
        >
          {RESP_LABELS[etape.responsable]}
        </span>

        {/* Date cible */}
        <span className="shrink-0 w-28 text-right text-xs text-zinc-400">
          {etape.date_realisation
            ? `✓ ${formatDate(etape.date_realisation)}`
            : etape.date_cible
            ? formatDate(etape.date_cible)
            : "—"}
        </span>

        <span className="text-zinc-300 group-open:rotate-90 transition-transform">▶</span>
      </summary>

      {/* Détail / formulaire de mise à jour */}
      <div className="mx-3 mb-2 rounded-md border border-zinc-100 bg-zinc-50 p-4">
        {canEdit ? (
          <form action={formAction} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">Nom</label>
              <input
                name="nom"
                defaultValue={etape.nom}
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Statut</label>
                <select
                  name="statut"
                  defaultValue={etape.statut}
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
                >
                  <option value="a_faire">À faire</option>
                  <option value="en_cours">En cours</option>
                  <option value="fait">Fait</option>
                  <option value="en_retard">En retard</option>
                  <option value="na">N/A</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Responsable</label>
                <select
                  name="responsable"
                  defaultValue={etape.responsable}
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
                >
                  <option value="mc">Nous</option>
                  <option value="franchise">Franchisé</option>
                  <option value="les_deux">Les deux</option>
                  <option value="externe">Externe</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">
                  Date de réalisation
                </label>
                <input
                  name="date_realisation"
                  type="date"
                  defaultValue={etape.date_realisation ?? ""}
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">
                  Lien document (SharePoint)
                </label>
                <input
                  name="lien_document"
                  type="url"
                  defaultValue={etape.lien_document ?? ""}
                  placeholder="https://…"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">Commentaire</label>
              <textarea
                name="commentaire"
                rows={2}
                defaultValue={etape.commentaire ?? ""}
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
              />
            </div>

            {state?.error && (
              <p className="text-xs text-red-600">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="btn-primary"
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>
        ) : (
          <div className="space-y-1 text-xs text-zinc-600">
            {etape.date_realisation && (
              <p>
                Réalisé le : <strong>{formatDate(etape.date_realisation)}</strong>
              </p>
            )}
            {etape.lien_document && (
              <p>
                Document :{" "}
                <a
                  href={etape.lien_document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Ouvrir
                </a>
              </p>
            )}
            {etape.commentaire && <p>Note : {etape.commentaire}</p>}
            {!etape.date_realisation && !etape.lien_document && !etape.commentaire && (
              <p className="text-zinc-400">Aucune information supplémentaire.</p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
