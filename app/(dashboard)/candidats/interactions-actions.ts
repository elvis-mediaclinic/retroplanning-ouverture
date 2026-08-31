"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const InteractionSchema = z.object({
  type: z.enum(["appel", "email", "visio", "visite_siege", "immersion_magasin", "visite_ville_candidat", "autre"]),
  libelle: z.string().optional(),
  date_realisee: z.string().min(1, { error: "Date requise." }),
  notes: z.string().optional(),
});

export type InteractionState = { error?: string } | undefined;

export async function createInteraction(
  candidatId: string,
  _state: InteractionState,
  formData: FormData
): Promise<InteractionState> {
  const session = await requireMC();
  const parsed = InteractionSchema.safeParse({
    type: formData.get("type"),
    libelle: formData.get("libelle") || undefined,
    date_realisee: formData.get("date_realisee"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("candidat_interactions").insert({
    candidat_id: candidatId,
    type: parsed.data.type,
    libelle: parsed.data.type === "autre" ? parsed.data.libelle ?? null : null,
    date_realisee: parsed.data.date_realisee,
    notes: parsed.data.notes ?? null,
    created_by: session.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/candidats/${candidatId}`);
  return {};
}

export async function updateInteraction(
  id: string,
  candidatId: string,
  _state: InteractionState,
  formData: FormData
): Promise<InteractionState> {
  await requireMC();
  const parsed = InteractionSchema.safeParse({
    type: formData.get("type"),
    libelle: formData.get("libelle") || undefined,
    date_realisee: formData.get("date_realisee"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidat_interactions")
    .update({
      type: parsed.data.type,
      libelle: parsed.data.type === "autre" ? parsed.data.libelle ?? null : null,
      date_realisee: parsed.data.date_realisee,
      notes: parsed.data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/candidats/${candidatId}`);
  return {};
}

export async function deleteInteraction(id: string, candidatId: string) {
  await requireMC();
  const supabase = await createClient();
  await supabase.from("candidat_interactions").delete().eq("id", id);
  revalidatePath(`/candidats/${candidatId}`);
}
