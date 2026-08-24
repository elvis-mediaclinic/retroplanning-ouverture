"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMarketing } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const VilleSchema = z.object({
  nom: z.string().min(1, { error: "Nom requis." }),
  departement: z.string().optional(),
  region: z.string().optional(),
  zone_chalandise: z.string().optional(),
  statut: z.enum(["en_etude", "validee", "abandonnee"]),
  notes: z.string().optional(),
});

export type VilleState = { error?: string } | undefined;

export async function createVille(
  _state: VilleState,
  formData: FormData
): Promise<VilleState> {
  const session = await requireMarketing();
  const parsed = VilleSchema.safeParse({
    nom: formData.get("nom"),
    departement: formData.get("departement") || undefined,
    region: formData.get("region") || undefined,
    zone_chalandise: formData.get("zone_chalandise") || undefined,
    statut: formData.get("statut"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("villes").insert({
    ...parsed.data,
    zone_chalandise: parsed.data.zone_chalandise ?? null,
    departement: parsed.data.departement ?? null,
    region: parsed.data.region ?? null,
    notes: parsed.data.notes ?? null,
    created_by: session.id,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/villes");
}

export async function updateVille(
  id: string,
  _state: VilleState,
  formData: FormData
): Promise<VilleState> {
  await requireMarketing();
  const parsed = VilleSchema.safeParse({
    nom: formData.get("nom"),
    departement: formData.get("departement") || undefined,
    region: formData.get("region") || undefined,
    zone_chalandise: formData.get("zone_chalandise") || undefined,
    statut: formData.get("statut"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("villes")
    .update({
      ...parsed.data,
      zone_chalandise: parsed.data.zone_chalandise ?? null,
      departement: parsed.data.departement ?? null,
      region: parsed.data.region ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/villes");
  redirect("/villes");
}
