import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createCandidat } from "../actions";
import { CandidatForm } from "../CandidatForm";

export default async function NewCandidatPage() {
  await requireMC();
  const supabase = await createClient();
  const [{ data: villes }, { data: cessionAnnonces }] = await Promise.all([
    supabase.from("villes").select("id, nom").order("nom"),
    supabase
      .from("annonces")
      .select("magasin_id, magasins(id, nom, ville)")
      .eq("type_annonce", "cession"),
  ]);

  const magasinsCession = (cessionAnnonces ?? [])
    .map((a) => {
      const raw = a.magasins as unknown;
      return Array.isArray(raw)
        ? (raw[0] as { id: string; nom: string; ville: string | null } | undefined)
        : (raw as { id: string; nom: string; ville: string | null } | null);
    })
    .filter((m): m is { id: string; nom: string; ville: string | null } => !!m);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-header-title">Nouveau candidat</h1>
      </div>
      <div>
        <Link href="/candidats" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Candidats
        </Link>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <CandidatForm action={createCandidat} villes={villes ?? []} magasinsCession={magasinsCession} submitLabel="Créer" />
      </div>
    </div>
  );
}
