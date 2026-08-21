"use server";

import { redirect } from "next/navigation";
import { requireMarketing } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export async function createAnnonce(villeId: string) {
  const profile = await requireMarketing();
  if (!villeId) return;

  const supabase = await createClient();

  const { data: ville } = await supabase
    .from("villes")
    .select("nom")
    .eq("id", villeId)
    .single();

  const { data, error } = await supabase
    .from("annonces")
    .insert({
      ville_id: villeId,
      titre: `Franchise Mediaclinic — ${ville?.nom ?? ""}`,
      actif: false,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("Impossible de créer l'annonce.");

  redirect(`/villes/${villeId}`);
}
