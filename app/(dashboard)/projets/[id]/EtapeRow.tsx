"use client";

import { useActionState } from "react";
import { updateEtape } from "./actions";
import type { EtapeProjet, MCUser, StatutEtape } from "@/lib/types";
import { STATUT_ETAPE_LABELS } from "@/lib/types";
import { STATUT_ETAPE_COLORS, formatDate } from "@/lib/utils";
import { MultiSelect, type SelectOption } from "./MultiSelect";
import { DateInput } from "./DateInput";

export function EtapeRow({
  etape,
  projetId,
  canEdit,
  mcUsers,
  currentUserId,
}: {
  etape: EtapeProjet;
  projetId: string;
  canEdit: boolean;
  mcUsers: MCUser[];
  currentUserId?: string;
}) {
  const action = updateEtape.bind(null, etape.id, projetId);
  const [state, formAction, pending] = useActionState(action, undefined);

  const mcOptions: SelectOption[] = mcUsers.map((u) => ({
    value: u.id,
    label: u.fonction ? `${u.prenom} ${u.nom} · ${u.fonction}` : `${u.prenom} ${u.nom}`,
  }));

  function mcNames(ids: string[] | null) {
    if (!ids || ids.length === 0) return null;
    return ids.map((id) => {
      const u = mcUsers.find((u) => u.id === id);
      if (!u) return id.slice(0, 8);
      return u.fonction ? `${u.prenom} ${u.nom} · ${u.fonction}` : `${u.prenom} ${u.nom}`;
    });
  }

  const dateAlert = (() => {
    if (!etape.date_cible || etape.statut === "fait" || etape.statut === "na") return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cible = new Date(etape.date_cible + "T00:00:00");
    const diff = Math.round((cible.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return "late" as const;
    if (diff === 0) return "today" as const;
    if (diff <= 7) return "soon" as const;
    return null;
  })();

  const isMyEtape = currentUserId && etape.resp_mc?.includes(currentUserId);

  return (
    <details className="group" key={etape.updated_at}>
      <summary className={`flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 [&::-webkit-details-marker]:hidden ${isMyEtape ? "bg-indigo-50/60" : ""}`}>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_ETAPE_COLORS[etape.statut as StatutEtape]}`}>
          {STATUT_ETAPE_LABELS[etape.statut as StatutEtape]}
        </span>

        <span className="flex-1 text-sm text-zinc-800">
          {etape.nom}
          {isMyEtape && <span className="ml-2 text-indigo-500 text-xs">← vous</span>}
        </span>

        <span className="flex items-center gap-1 shrink-0">
          {(() => {
            const names = mcNames(etape.resp_mc);
            return names ? (
              <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium">
                MC · {names.join(", ")}
              </span>
            ) : null;
          })()}
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
            <span className="rounded-full bg-zinc-100 text-zinc-400 px-2 py-0.5 text-xs font-medium">—</span>
          )}
        </span>

        <span className={`shrink-0 w-36 text-right text-xs flex items-center justify-end gap-1 ${
          dateAlert === "late" ? "text-red-600 font-semibold" :
          dateAlert === "today" ? "text-amber-600 font-semibold" :
          dateAlert === "soon" ? "text-yellow-600" :
          "text-zinc-400"
        }`}>
          {dateAlert === "late" && <span title="Date dépassée">⚠️</span>}
          {dateAlert === "today" && <span title="Aujourd'hui">🔴</span>}
          {dateAlert === "soon" && <span title="Dans moins de 7 jours">🟡</span>}
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                <MultiSelect
                  name="resp_mc"
                  options={mcOptions}
                  defaultValue={etape.resp_mc ?? []}
                  placeholder="—"
                />
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
                <label className="text-xs font-medium text-zinc-600">Date cible</label>
                <DateInput name="date_cible" defaultValue={etape.date_cible ?? ""} className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Date de réalisation</label>
                <DateInput name="date_realisation" defaultValue={etape.date_realisation ?? ""} className="w-full rounded border border-zinc-300 px-2 py-1.5 text-xs" />
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
            {(() => {
              const names = mcNames(etape.resp_mc);
              return names ? <p>MC : <strong>{names.join(", ")}</strong></p> : null;
            })()}
            {etape.resp_franchise && <p>Franchisé : <strong>{etape.resp_franchise}</strong></p>}
            {etape.resp_externe && <p>Externe : <strong>{etape.resp_externe}</strong></p>}
            {etape.date_realisation && <p>Réalisé le : <strong>{formatDate(etape.date_realisation)}</strong></p>}
            {etape.lien_document && (
              <p>Document : <a href={etape.lien_document} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ouvrir</a></p>
            )}
            {etape.commentaire && <p>Note : {etape.commentaire}</p>}
            {!etape.resp_mc?.length && !etape.resp_franchise && !etape.date_realisation && !etape.lien_document && !etape.commentaire && (
              <p className="text-zinc-400">Aucune information supplémentaire.</p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
