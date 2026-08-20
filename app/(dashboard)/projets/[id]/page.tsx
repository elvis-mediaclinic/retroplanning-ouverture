import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import {
  FORMAT_LABELS,
  TYPE_LABELS,
  STATUT_PROJET_LABELS,
  STATUT_ETAPE_LABELS,
  PHASE_LABELS,
  type PhaseEtape,
  type StatutEtape,
  type EtapeProjet,
  type MCUser,
} from "@/lib/types";
import { InviteButton } from "./InviteButton";
import {
  STATUT_PROJET_COLORS,
  STATUT_ETAPE_COLORS,
  formatDate,
} from "@/lib/utils";
import { AddEtapeForm } from "./AddEtapeForm";
import { SortableEtapeList } from "./SortableEtapeList";

const PHASES_ORDER: PhaseEtape[] = [
  "administratif_financement",
  "communication",
  "ressources_humaines",
  "travaux_amenagement",
  "formation",
  "stock_fournisseurs",
  "ouverture",
];

export default async function ProjetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getProfile();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: projet }, { data: etapes }, { data: mcUsersData }] = await Promise.all([
    supabase
      .from("projets")
      .select(
        `*, villes(nom, departement), candidats(nom, prenom, telephone, email),
         profiles!projets_franchisee_id_fkey(nom, prenom, email)`
      )
      .eq("id", id)
      .single(),
    supabase
      .from("etapes_projet")
      .select("*")
      .eq("projet_id", id)
      .order("ordre"),
    supabase
      .from("profiles")
      .select("id, nom, prenom, role, fonction")
      .in("role", ["admin", "responsable_mc"]),
  ]);

  const mcUsers: MCUser[] = mcUsersData ?? [];

  if (!projet) notFound();

  // Vérifie l'accès franchise
  if (profile.role === "franchise" && projet.franchisee_id !== profile.id) {
    notFound();
  }

  const isMC = profile.role === "admin" || profile.role === "consultant" || profile.role === "responsable_mc";
  // admin/franchise : peuvent tout modifier
  // responsable_mc : peuvent modifier uniquement les étapes où ils sont assignés (géré dans EtapeRow)
  const canEditAll = profile.role === "admin" || profile.role === "franchise";
  const isResponsableMC = profile.role === "responsable_mc";

  const etapesParPhase = PHASES_ORDER.reduce<Record<PhaseEtape, EtapeProjet[]>>(
    (acc, phase) => {
      acc[phase] = (etapes ?? []).filter((e) => e.phase === phase);
      return acc;
    },
    {} as Record<PhaseEtape, EtapeProjet[]>
  );

  const totalEtapes = etapes?.length ?? 0;
  const etapesFaites = etapes?.filter((e) => e.statut === "fait").length ?? 0;
  const progression = totalEtapes > 0 ? Math.round((etapesFaites / totalEtapes) * 100) : 0;

  const ville = projet.villes as { nom: string; departement: string | null } | null;
  const candidat = projet.candidats as { nom: string; prenom: string; telephone: string | null; email: string } | null;
  const franchisee = projet.profiles as { nom: string; prenom: string; email: string } | null;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={isMC ? "/projets" : "/mon-projet"}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            ← {isMC ? "Ouvertures" : "Mon projet"}
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900">{projet.nom}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUT_PROJET_COLORS[projet.statut as keyof typeof STATUT_PROJET_COLORS]
              }`}
            >
              {STATUT_PROJET_LABELS[projet.statut as keyof typeof STATUT_PROJET_LABELS]}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {TYPE_LABELS[projet.type_magasin as keyof typeof TYPE_LABELS]} ·{" "}
            {FORMAT_LABELS[projet.format_magasin as keyof typeof FORMAT_LABELS]}
            {projet.surface_m2 && ` · ${projet.surface_m2} m²`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/projets/${id}/gantt`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Vue Gantt
          </Link>
          {profile.role === "admin" && !projet.franchisee_id && (
            <InviteButton projetId={id} />
          )}
          {profile.role === "admin" && (
            <Link
              href={`/projets/${id}/edit`}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Modifier
            </Link>
          )}
        </div>
      </div>

      {/* Infos & progression */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Ouverture cible</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {formatDate(projet.date_cible_ouverture)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Ville</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {ville ? `${ville.nom}${ville.departement ? ` (${ville.departement})` : ""}` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Franchisé</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {candidat ? `${candidat.prenom} ${candidat.nom}` : franchisee ? `${franchisee.prenom} ${franchisee.nom}` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Progression</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {etapesFaites} / {totalEtapes} étapes ({progression}%)
          </p>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-2 rounded-full bg-green-500 transition-all"
          style={{ width: `${progression}%` }}
        />
      </div>

      {/* Liens utiles */}
      {(projet.lien_sharepoint || (isMC && (candidat?.email || franchisee?.email))) && (
        <div className="flex flex-wrap gap-3">
          {projet.lien_sharepoint && (
            <a
              href={projet.lien_sharepoint}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 shadow-sm"
            >
              📁 Dossier SharePoint
            </a>
          )}
        </div>
      )}

      {/* Retroplanning par phase */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Retroplanning</h2>

        {PHASES_ORDER.map((phase) => {
          const phaseEtapes = etapesParPhase[phase];
          if (phaseEtapes.length === 0) return null;

          const phaseFaites = phaseEtapes.filter((e) => e.statut === "fait").length;
          const phaseNa = phaseEtapes.filter((e) => e.statut === "na").length;
          const phaseTotal = phaseEtapes.length;

          return (
            <div
              key={phase}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
            >
              {/* En-tête phase */}
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-zinc-800">
                  {PHASE_LABELS[phase]}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-1.5 rounded-full bg-green-500"
                      style={{
                        width: `${phaseTotal > 0 ? Math.round(((phaseFaites + phaseNa) / phaseTotal) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500">
                    {phaseFaites}/{phaseTotal}
                    {phaseNa > 0 && ` (+${phaseNa} N/A)`}
                  </span>
                </div>
              </div>

              {/* Étapes */}
              <SortableEtapeList
                etapes={phaseEtapes}
                projetId={id}
                canEditAll={canEditAll}
                isResponsableMC={isResponsableMC}
                mcUsers={mcUsers}
                currentUserId={profile.id}
              />

              {canEditAll && (
                <AddEtapeForm projetId={id} phase={phase} mcUsers={mcUsers} />
              )}
            </div>
          );
        })}

        {totalEtapes === 0 && (
          <p className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-400 shadow-sm">
            Aucune étape générée pour ce projet.
          </p>
        )}
      </div>

      {/* Notes */}
      {projet.notes && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-zinc-500 mb-1">Notes</p>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{projet.notes}</p>
        </div>
      )}
    </div>
  );
}
