import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { GanttChart } from "./GanttChart";

export default async function GanttPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: projet }, { data: etapes }] = await Promise.all([
    supabase.from("projets").select("id, nom, date_cible_ouverture, franchisee_id, created_at").eq("id", id).single(),
    supabase.from("etapes_projet").select("*").eq("projet_id", id).order("ordre"),
  ]);

  if (!projet) notFound();
  if (profile.role === "franchise" && projet.franchisee_id !== profile.id) notFound();

  const isMC = profile.role === "admin" || profile.role === "consultant" || profile.role === "responsable_mc";
  const canEdit = profile.role === "admin" || profile.role === "franchise";

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase text-white">Gantt — {projet.nom}</h1>
        <Link
          href={`/projets/${id}`}
          className="rounded-md border border-white/40 px-3 py-1.5 text-sm text-white hover:bg-white/10"
        >
          Vue liste
        </Link>
      </div>
      <div>
        <Link
          href={isMC ? `/projets/${id}` : "/mon-projet"}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← {projet.nom}
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <GanttChart etapes={etapes ?? []} dateOuverture={projet.date_cible_ouverture} dateCreation={projet.created_at} projetId={id} canEdit={canEdit} />
      </div>
    </div>
  );
}
