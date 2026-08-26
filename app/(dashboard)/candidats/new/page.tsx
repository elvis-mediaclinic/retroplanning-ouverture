import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createCandidat } from "../actions";
import { CandidatForm } from "../CandidatForm";

export default async function NewCandidatPage() {
  await requireMC();
  const supabase = await createClient();
  const { data: villes } = await supabase
    .from("villes")
    .select("id, nom")
    .order("nom");

  return (
    <div className="space-y-6">
      <div className="mt-2">
        <h1 className="text-2xl font-bold uppercase text-[#0089bd]">Nouveau candidat</h1>
      </div>
      <div>
        <Link href="/candidats" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Candidats
        </Link>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <CandidatForm action={createCandidat} villes={villes ?? []} submitLabel="Créer" />
      </div>
    </div>
  );
}
