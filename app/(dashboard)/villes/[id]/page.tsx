import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateVille } from "../actions";
import { VilleForm } from "../VilleForm";

export default async function EditVillePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMC();
  const { id } = await params;
  const supabase = await createClient();

  const { data: ville } = await supabase
    .from("villes")
    .select("*")
    .eq("id", id)
    .single();

  if (!ville) notFound();

  const action = updateVille.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/villes" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Villes
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-zinc-900">{ville.nom}</h1>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <VilleForm action={action} defaultValues={ville} />
      </div>
    </div>
  );
}
