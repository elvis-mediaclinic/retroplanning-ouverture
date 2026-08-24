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
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase text-white">{franchise.nom}</h1>
        <DeleteFranchiseButton id={id} />
      </div>
      <div>
        <a href="/reseau/franchises" className="text-sm text-zinc-500 hover:text-zinc-900">← Franchisés</a>
      </div>
      <FranchiseForm franchise={franchise} />
    </div>
  );
}
