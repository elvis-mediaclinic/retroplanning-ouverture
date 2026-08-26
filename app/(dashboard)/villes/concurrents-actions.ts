"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const ConcurrentSchema = z.object({
  enseigne: z.string().min(1, { error: "Nom de l'enseigne requis." }),
  type: z.enum(["reparateur", "cash", "revendeur", "autre"]),
  franchise: z.coerce.boolean(),
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
    type: formData.get("type") || "autre",
    franchise: formData.get("franchise") === "true",
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
    type: formData.get("type") || "autre",
    franchise: formData.get("franchise") === "true",
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
