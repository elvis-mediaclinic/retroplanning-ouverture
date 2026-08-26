import { notFound } from "next/navigation";
import { getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { GanttView } from "./GanttView";

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
  if (profile.role === "consultant") notFound();

  const isMC = profile.role === "admin" || profile.role === "responsable_mc";
  const canEdit = profile.role === "admin" || profile.role === "franchise";

  return (
    <GanttView
      projetId={id}
      projetNom={projet.nom}
      isMC={isMC}
      canEdit={canEdit}
      etapes={etapes ?? []}
      dateOuverture={projet.date_cible_ouverture}
      dateCreation={projet.created_at}
    />
  );
}
