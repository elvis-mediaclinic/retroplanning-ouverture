import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Franchise } from "@/lib/types";
import { FranchiseForm } from "../FranchiseForm";
import { DeleteFranchiseButton } from "./DeleteFranchiseButton";

export default async function EditFranchisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("franchises").select("*").eq("id", id).single();
  if (!data) notFound();

  const franchise = data as Franchise;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <a href="/reseau/franchises" className="text-sm text-zinc-500 hover:text-zinc-900">← Franchisés</a>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900">{franchise.nom}</h1>
        </div>
        <DeleteFranchiseButton id={id} />
      </div>
      <FranchiseForm franchise={franchise} />
    </div>
  );
}
