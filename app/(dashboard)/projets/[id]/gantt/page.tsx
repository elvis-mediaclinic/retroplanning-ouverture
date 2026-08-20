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
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={isMC ? `/projets/${id}` : "/mon-projet"}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            ← {projet.nom}
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">Gantt — {projet.nom}</h1>
        </div>
        <Link
          href={`/projets/${id}`}
          className="btn-secondary text-sm"
        >
          Vue liste
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <GanttChart etapes={etapes ?? []} dateOuverture={projet.date_cible_ouverture} dateCreation={projet.created_at} projetId={id} canEdit={canEdit} />
      </div>
    </div>
  );
}
