import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Magasin, Franchise } from "@/lib/types";
import { MagasinForm } from "../MagasinForm";
import { DeleteMagasinButton } from "./DeleteMagasinButton";

export default async function EditMagasinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data }, { data: franchisesData }] = await Promise.all([
    supabase.from("magasins").select("*").eq("id", id).single(),
    supabase.from("franchises").select("*").order("nom"),
  ]);

  if (!data) notFound();

  const magasin = data as Magasin;
  const franchises = (franchisesData ?? []) as Franchise[];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <a href="/reseau" className="text-sm text-zinc-500 hover:text-zinc-900">← Réseau</a>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900">{magasin.nom}</h1>
        </div>
        <DeleteMagasinButton id={id} />
      </div>
      <MagasinForm magasin={magasin} franchises={franchises} />
    </div>
  );
}
