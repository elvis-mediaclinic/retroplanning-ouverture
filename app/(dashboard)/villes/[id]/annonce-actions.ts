"use server";

import { revalidatePath } from "next/cache";
import { requireMarketing } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type AnnonceState = { error?: string; ok?: boolean } | undefined;

export async function upsertAnnonce(
  villeId: string,
  annonceId: string | null,
  _state: AnnonceState,
  formData: FormData
): Promise<AnnonceState> {
  const session = await requireMarketing();
  const supabase = await createClient();

  const sectionsRaw = (formData.get("sections") as string | null) || null;
  const payload = {
    ville_id: villeId,
    titre: (formData.get("titre") as string).trim(),
    accroche: (formData.get("accroche") as string | null)?.trim() || null,
    sections: sectionsRaw ? JSON.parse(sectionsRaw) : null,
    actif: formData.get("actif") === "true",
    hero_bleu: formData.get("hero_bleu") === "true",
    updated_at: new Date().toISOString(),
  };

  if (!payload.titre) return { error: "Le titre est requis." };

  let error;
  if (annonceId) {
    ({ error } = await supabase.from("annonces").update(payload).eq("id", annonceId));
  } else {
    ({ error } = await supabase.from("annonces").insert({ ...payload, created_by: session.id }));
  }

  if (error) return { error: error.message };

  revalidatePath(`/villes/${villeId}`);
  return { ok: true };
}

export async function toggleAnnonce(annonceId: string, actif: boolean, villeId: string) {
  await requireMarketing();
  const supabase = await createClient();
  await supabase.from("annonces").update({ actif, updated_at: new Date().toISOString() }).eq("id", annonceId);
  revalidatePath(`/villes/${villeId}`);
}
