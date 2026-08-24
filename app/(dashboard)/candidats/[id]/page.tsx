import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateCandidat, inviteCandidat } from "../actions";
import { CandidatForm } from "../CandidatForm";
import { InviteButton } from "./InviteButton";
import { InteractionTimeline } from "./InteractionTimeline";
import type { CandidatInteraction } from "@/lib/types";

export default async function EditCandidatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireMC();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: candidat }, { data: villes }, { data: candidatVilles }, { data: interactions }] = await Promise.all([
    supabase.from("candidats").select("*").eq("id", id).single(),
    supabase.from("villes").select("id, nom").order("nom"),
    supabase.from("candidat_villes").select("ville_id").eq("candidat_id", id),
    supabase.from("candidat_interactions").select("*").eq("candidat_id", id).order("created_at", { ascending: false }),
  ]);

  if (!candidat) notFound();

  const selectedVilleIds = (candidatVilles ?? []).map((cv) => cv.ville_id);

  const action = updateCandidat.bind(null, id);
  const invite = inviteCandidat.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/candidats" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Candidats
        </Link>
      </div>
      <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm flex items-center gap-3">
        <h1 className="text-2xl font-bold uppercase text-white">
          {candidat.prenom} {candidat.nom}
        </h1>
        {profile.role === "admin" && !candidat.profil_id && (
          <InviteButton action={invite} />
        )}
        {candidat.profil_id && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            ✓ Compte actif
          </span>
        )}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <CandidatForm action={action} defaultValues={candidat} villes={villes ?? []} selectedVilleIds={selectedVilleIds} />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Suivi des échanges</h2>
        <InteractionTimeline candidatId={id} interactions={(interactions ?? []) as CandidatInteraction[]} />
      </div>
    </div>
  );
}
