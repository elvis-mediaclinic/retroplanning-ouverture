"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const ConcurrentSchema = z.object({
  enseigne: z.string().min(1, { error: "Nom de l'enseigne requis." }),
  type: z.enum(["reparateur_reseau", "reparateur_independant", "cash_avec_reparation", "cash_generaliste", "destockage"]),
  franchise: z.coerce.boolean(),
  nb_magasins: z.coerce.number().int().min(1, { error: "Au moins 1 magasin." }),
  distance_minutes: z.coerce.number().int().min(0, { error: "Distance invalide." }),
  notes: z.string().optional(),
});

export type ConcurrentState = { error?: string } | undefined;

export async function createConcurrent(
  villeId: string,
  _state: ConcurrentState,
  formData: FormData
): Promise<ConcurrentState> {
  const session = await requireMC();
  const parsed = ConcurrentSchema.safeParse({
    enseigne: formData.get("enseigne"),
    type: formData.get("type") || "destockage",
    franchise: formData.get("franchise") === "true",
    nb_magasins: formData.get("nb_magasins") || 1,
    distance_minutes: formData.get("distance_minutes") || 10,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ville_concurrents").insert({
    ville_id: villeId,
    enseigne: parsed.data.enseigne,
    type: parsed.data.type,
    franchise: parsed.data.franchise,
    nb_magasins: parsed.data.nb_magasins,
    distance_minutes: parsed.data.distance_minutes,
    notes: parsed.data.notes ?? null,
    created_by: session.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/villes/${villeId}`);
  return {};
}

export async function updateConcurrent(
  id: string,
  villeId: string,
  _state: ConcurrentState,
  formData: FormData
): Promise<ConcurrentState> {
  await requireMC();
  const parsed = ConcurrentSchema.safeParse({
    enseigne: formData.get("enseigne"),
    type: formData.get("type") || "destockage",
    franchise: formData.get("franchise") === "true",
    nb_magasins: formData.get("nb_magasins") || 1,
    distance_minutes: formData.get("distance_minutes") || 10,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ville_concurrents")
    .update({
      enseigne: parsed.data.enseigne,
      type: parsed.data.type,
      franchise: parsed.data.franchise,
      nb_magasins: parsed.data.nb_magasins,
      distance_minutes: parsed.data.distance_minutes,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/villes/${villeId}`);
  return {};
}

export async function deleteConcurrent(id: string, villeId: string) {
  await requireMC();
  const supabase = await createClient();
  await supabase.from("ville_concurrents").delete().eq("id", id);
  revalidatePath(`/villes/${villeId}`);
}
