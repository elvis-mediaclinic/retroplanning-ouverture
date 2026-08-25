"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const CandidatSchema = z.object({
  nom: z.string().min(1, { error: "Nom requis." }),
  prenom: z.string().min(1, { error: "Prénom requis." }),
  email: z.email({ error: "Email invalide." }),
  telephone: z.string().optional(),
  apport_personnel: z.coerce.number().positive().optional(),
  zone_souhaitee: z.string().optional(),
  statut: z.enum(["prospect", "en_evaluation", "valide", "signe", "refuse"]),
  notes: z.string().optional(),
});

export type CandidatState = { error?: string } | undefined;

export async function createCandidat(
  _state: CandidatState,
  formData: FormData
): Promise<CandidatState> {
  const session = await requireMC();
  const parsed = CandidatSchema.safeParse({
    nom: formData.get("nom"),
    prenom: formData.get("prenom"),
    email: formData.get("email"),
    telephone: formData.get("telephone") || undefined,
    apport_personnel: formData.get("apport_personnel") || undefined,
    ville_id: formData.get("ville_id") || undefined,
    zone_souhaitee: formData.get("zone_souhaitee") || undefined,
    statut: formData.get("statut") || "prospect",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const villeIds = formData.getAll("ville_ids") as string[];

  const supabase = await createClient();
  const { data: newCandidat, error } = await supabase.from("candidats").insert({
    nom: parsed.data.nom,
    prenom: parsed.data.prenom,
    email: parsed.data.email,
    telephone: parsed.data.telephone ?? null,
    apport_personnel: parsed.data.apport_personnel ?? null,
    zone_souhaitee: parsed.data.zone_souhaitee ?? null,
    statut: parsed.data.statut,
    notes: parsed.data.notes ?? null,
    created_by: session.id,
  }).select("id").single();

  if (error) return { error: error.message };

  if (newCandidat && villeIds.length > 0) {
    await supabase.from("candidat_villes").insert(
      villeIds.map((ville_id) => ({ candidat_id: newCandidat.id, ville_id }))
    );
  }

  redirect("/candidats");
}

export async function updateCandidat(
  id: string,
  _state: CandidatState,
  formData: FormData
): Promise<CandidatState> {
  await requireMC();
  const parsed = CandidatSchema.safeParse({
    nom: formData.get("nom"),
    prenom: formData.get("prenom"),
    email: formData.get("email"),
    telephone: formData.get("telephone") || undefined,
    apport_personnel: formData.get("apport_personnel") || undefined,
    ville_id: formData.get("ville_id") || undefined,
    zone_souhaitee: formData.get("zone_souhaitee") || undefined,
    statut: formData.get("statut") || "prospect",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const villeIds = formData.getAll("ville_ids") as string[];

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidats")
    .update({
      nom: parsed.data.nom,
      prenom: parsed.data.prenom,
      email: parsed.data.email,
      telephone: parsed.data.telephone ?? null,
      apport_personnel: parsed.data.apport_personnel ?? null,
      zone_souhaitee: parsed.data.zone_souhaitee ?? null,
      statut: parsed.data.statut,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Remplace les villes liées
  await supabase.from("candidat_villes").delete().eq("candidat_id", id);
  if (villeIds.length > 0) {
    await supabase.from("candidat_villes").insert(
      villeIds.map((ville_id) => ({ candidat_id: id, ville_id }))
    );
  }

  revalidatePath("/candidats");
  redirect("/candidats");
}
