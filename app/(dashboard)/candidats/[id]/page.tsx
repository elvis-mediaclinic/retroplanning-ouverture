import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMCOrConsultant, getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateCandidat } from "../actions";
import { CandidatForm } from "../CandidatForm";
import { CandidatDetailView } from "./CandidatDetailView";
import { InteractionTimeline } from "./InteractionTimeline";
import type { CandidatInteraction, CandidatAssocie } from "@/lib/types";

export default async function EditCandidatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireMCOrConsultant();
  const profile = await getProfile();
  const canEdit = profile.role !== "consultant";
  const { id } = await params;
  const editMode = canEdit && (await searchParams).edit === "1";
  const supabase = await createClient();

  const [{ data: candidat }, { data: villes }, { data: candidatVilles }, { data: interactions }, { data: associes }, { data: cessionAnnonces }, { data: candidatMagasins }] = await Promise.all([
    supabase.from("candidats").select("*").eq("id", id).single(),
    supabase.from("villes").select("id, nom").order("nom"),
    supabase.from("candidat_villes").select("ville_id").eq("candidat_id", id),
    supabase.from("candidat_interactions").select("*").eq("candidat_id", id).order("created_at", { ascending: false }),
    supabase.from("candidat_associes").select("*").eq("candidat_id", id).order("ordre"),
    supabase
      .from("annonces")
      .select("magasin_id, magasins(id, nom, ville)")
      .eq("type_annonce", "cession"),
    supabase.from("candidat_magasins").select("magasin_id").eq("candidat_id", id),
  ]);

  if (!candidat) notFound();

  const { data: candidatureConsultant } = await supabase
    .from("candidatures")
    .select("consultant:profiles(prenom, nom)")
    .eq("email", candidat.email)
    .not("consultant_id", "is", null)
    .limit(1)
    .maybeSingle();

  const consultantRaw = candidatureConsultant?.consultant as unknown;
  const consultant = Array.isArray(consultantRaw)
    ? (consultantRaw[0] as { prenom: string; nom: string } | undefined)
    : (consultantRaw as { prenom: string; nom: string } | null);

  const selectedVilleIds = (candidatVilles ?? []).map((cv) => cv.ville_id);
  const selectedMagasinIds = (candidatMagasins ?? []).map((cm) => cm.magasin_id);
  const magasinsCession = (cessionAnnonces ?? [])
    .map((a) => {
      const raw = a.magasins as unknown;
      return Array.isArray(raw)
        ? (raw[0] as { id: string; nom: string; ville: string | null } | undefined)
        : (raw as { id: string; nom: string; ville: string | null } | null);
    })
    .filter((m): m is { id: string; nom: string; ville: string | null } => !!m);
  const associesList = (associes ?? []) as CandidatAssocie[];
  const allNames = [`${candidat.prenom} ${candidat.nom}`, ...associesList.map((a) => `${a.prenom} ${a.nom}`)].join(", ");

  const action = updateCandidat.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="page-header-title">
            {allNames}
          </h1>
          {candidat.profil_id && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              ✓ Compte actif
            </span>
          )}
          {consultant && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
              Consultant — {consultant.prenom} {consultant.nom}
            </span>
          )}
        </div>
        {canEdit && !editMode && (
          <Link href={`/candidats/${id}?edit=1`} className="btn-primary text-sm shrink-0">
            Modifier
          </Link>
        )}
      </div>
      <div>
        <Link href="/candidats" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Candidats
        </Link>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        {editMode ? (
          <div className="space-y-3">
            <CandidatForm
              action={action}
              defaultValues={candidat}
              villes={villes ?? []}
              selectedVilleIds={selectedVilleIds}
              magasinsCession={magasinsCession}
              selectedMagasinIds={selectedMagasinIds}
              associes={associesList}
            />
            <Link href={`/candidats/${id}`} className="text-xs text-zinc-500 hover:text-zinc-900">
              ← Revenir à l&apos;affichage
            </Link>
          </div>
        ) : (
          <CandidatDetailView
            candidat={candidat}
            associes={associesList}
            villes={villes ?? []}
            selectedVilleIds={selectedVilleIds}
            magasinsCession={magasinsCession}
            selectedMagasinIds={selectedMagasinIds}
          />
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Suivi des échanges</h2>
        <InteractionTimeline candidatId={id} interactions={(interactions ?? []) as CandidatInteraction[]} readOnly={!canEdit} />
      </div>
    </div>
  );
}
