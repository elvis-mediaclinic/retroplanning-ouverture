import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createProjet } from "../actions";
import { ProjetForm } from "../ProjetForm";

export default async function NewProjetPage() {
  await requireMC();
  const supabase = await createClient();

  const [{ data: villes }, { data: candidats }, { data: franchisees }] =
    await Promise.all([
      supabase.from("villes").select("id, nom").order("nom"),
      supabase.from("candidats").select("id, nom, prenom").order("nom"),
      supabase.from("profiles").select("id, nom, prenom").eq("role", "franchise").order("nom"),
    ]);

  return (
    <div className="space-y-6">
      <div className="mt-2">
        <h1 className="text-2xl font-bold uppercase text-[#0089bd]">Nouveau projet</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Les 33 étapes du retroplanning seront générées automatiquement.
        </p>
      </div>
      <div>
        <Link href="/projets" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Ouvertures
        </Link>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <ProjetForm
          action={createProjet}
          villes={villes ?? []}
          candidats={candidats ?? []}
          franchisees={franchisees ?? []}
          submitLabel="Créer le projet"
        />
      </div>
    </div>
  );
}
