import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Franchise } from "@/lib/types";
import { MagasinForm } from "../MagasinForm";

export default async function NewMagasinPage({
  searchParams,
}: {
  searchParams: Promise<{ projet_id?: string; projet_nom?: string }>;
}) {
  await requireRole("admin");
  const { projet_id, projet_nom } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("franchises").select("*").order("nom");
  const franchises = (data ?? []) as Franchise[];

  return (
    <div className="space-y-6">
      <div className="mt-2">
        <h1 className="text-2xl font-bold uppercase text-[#0089bd]">Nouveau magasin</h1>
      </div>
      <div>
        <a href="/reseau" className="text-sm text-zinc-500 hover:text-zinc-900">← Magasins</a>
      </div>
      <MagasinForm
        projetId={projet_id}
        projetNom={projet_nom ? decodeURIComponent(projet_nom) : null}
        franchises={franchises}
      />
    </div>
  );
}
