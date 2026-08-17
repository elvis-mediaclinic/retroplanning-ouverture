import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateCandidat, inviteCandidat } from "../actions";
import { CandidatForm } from "../CandidatForm";
import { InviteButton } from "./InviteButton";

export default async function EditCandidatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireMC();
  const { id } = await params;
  const supabase = await createClient();

  const { data: candidat } = await supabase
    .from("candidats")
    .select("*")
    .eq("id", id)
    .single();

  if (!candidat) notFound();

  const action = updateCandidat.bind(null, id);
  const invite = inviteCandidat.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/candidats" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Candidats
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-900">
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
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <CandidatForm action={action} defaultValues={candidat} />
      </div>
    </div>
  );
}
