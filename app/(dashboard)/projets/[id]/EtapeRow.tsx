"use client";

import { useActionState } from "react";
import { updateEtape } from "./actions";
import type { EtapeProjet, StatutEtape } from "@/lib/types";
import { STATUT_ETAPE_LABELS, RESP_MC_OPTIONS } from "@/lib/types";
import { STATUT_ETAPE_COLORS, formatDate } from "@/lib/utils";
import { MultiSelect } from "./MultiSelect";

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
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_ETAPE_COLORS[etape.statut as StatutEtape]}`}>
          {STATUT_ETAPE_LABELS[etape.statut as StatutEtape]}
        </span>

        <span className="flex-1 text-sm text-zinc-800">{etape.nom}</span>

        <span className="flex items-center gap-1 shrink-0">
          {etape.resp_mc && etape.resp_mc.length > 0 && (
            <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium">
              MC · {etape.resp_mc.join(", ")}
            </span>
          )}
          {etape.resp_franchise && (
            <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs font-medium">
              F · {etape.resp_franchise}
            </span>
          )}
          {etape.resp_externe && (
            <span className="rounded-full bg-zinc-100 text-zinc-600 px-2 py-0.5 text-xs font-medium">
              Ext · {etape.resp_externe}
            </span>
          )}
          {!etape.resp_mc?.length && !etape.resp_franchise && !etape.resp_externe && (
            <span className="rounded-full bg-zinc-100 text-zinc-400 px-2 py-0.5 text-xs font-medium">
              —
            </span>
          )}
        </span>

        <span className="shrink-0 w-28 text-right text-xs text-zinc-400">
          {etape.date_realisation
            ? `✓ ${formatDate(etape.date_realisation)}`
            : etape.date_cible
            ? formatDate(etape.date_cible)
            : "—"}
        </span>

        <span className="text-zinc-300 group-open:rotate-90 transition-transform">▶</span>
      </summary>

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
                <select name="statut" defaultValue={etape.statut} className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs">
                  <option value="a_faire">À faire</option>
                  <option value="en_cours">En cours</option>
                  <option value="fait">Fait</option>
                  <option value="en_retard">En retard</option>
                  <option value="na">N/A</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Resp. MC</label>
                <MultiSelect name="resp_mc" options={RESP_MC_OPTIONS} defaultValue={etape.resp_mc ?? []} placeholder="—" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Resp. franchisé</label>
                <input
                  name="resp_franchise"
                  defaultValue={etape.resp_franchise ?? ""}
                  placeholder="Nom du porteur…"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Resp. externe</label>
                <input
                  name="resp_externe"
                  defaultValue={etape.resp_externe ?? ""}
                  placeholder="Prestataire, agence…"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Date de réalisation</label>
                <input name="date_realisation" type="date" defaultValue={etape.date_realisation ?? ""} className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">Lien document (SharePoint)</label>
              <input name="lien_document" type="url" defaultValue={etape.lien_document ?? ""} placeholder="https://…" className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">Commentaire</label>
              <textarea name="commentaire" rows={2} defaultValue={etape.commentaire ?? ""} className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs" />
            </div>

            {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>
        ) : (
          <div className="space-y-1 text-xs text-zinc-600">
            {etape.resp_mc && etape.resp_mc.length > 0 && <p>MC : <strong>{etape.resp_mc.join(", ")}</strong></p>}
            {etape.resp_franchise && <p>Franchisé : <strong>{etape.resp_franchise}</strong></p>}
            {etape.resp_externe && <p>Externe : <strong>{etape.resp_externe}</strong></p>}
            {etape.date_realisation && <p>Réalisé le : <strong>{formatDate(etape.date_realisation)}</strong></p>}
            {etape.lien_document && (
              <p>Document : <a href={etape.lien_document} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ouvrir</a></p>
            )}
            {etape.commentaire && <p>Note : {etape.commentaire}</p>}
            {!etape.resp_mc && !etape.resp_franchise && !etape.date_realisation && !etape.lien_document && !etape.commentaire && (
              <p className="text-zinc-400">Aucune information supplémentaire.</p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
