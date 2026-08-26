import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateCandidat } from "../actions";
import { CandidatForm } from "../CandidatForm";
import { InteractionTimeline } from "./InteractionTimeline";
import type { CandidatInteraction, CandidatAssocie } from "@/lib/types";

export default async function EditCandidatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMC();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: candidat }, { data: villes }, { data: candidatVilles }, { data: interactions }, { data: associes }] = await Promise.all([
    supabase.from("candidats").select("*").eq("id", id).single(),
    supabase.from("villes").select("id, nom").order("nom"),
    supabase.from("candidat_villes").select("ville_id").eq("candidat_id", id),
    supabase.from("candidat_interactions").select("*").eq("candidat_id", id).order("created_at", { ascending: false }),
    supabase.from("candidat_associes").select("*").eq("candidat_id", id).order("ordre"),
  ]);

  if (!candidat) notFound();

  const selectedVilleIds = (candidatVilles ?? []).map((cv) => cv.ville_id);
  const associesList = (associes ?? []) as CandidatAssocie[];
  const allNames = [`${candidat.prenom} ${candidat.nom}`, ...associesList.map((a) => `${a.prenom} ${a.nom}`)].join(", ");

  const action = updateCandidat.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center gap-3">
        <h1 className="page-header-title">
          {allNames}
        </h1>
        {candidat.profil_id && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            ✓ Compte actif
          </span>
        )}
      </div>
      <div>
        <Link href="/candidats" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Candidats
        </Link>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <CandidatForm
          action={action}
          defaultValues={candidat}
          villes={villes ?? []}
          selectedVilleIds={selectedVilleIds}
          associes={associesList}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Suivi des échanges</h2>
        <InteractionTimeline candidatId={id} interactions={(interactions ?? []) as CandidatInteraction[]} />
      </div>
    </div>
  );
}
