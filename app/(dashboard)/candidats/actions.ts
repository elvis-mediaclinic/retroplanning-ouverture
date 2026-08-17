"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMC, requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const CandidatSchema = z.object({
  nom: z.string().min(1, { error: "Nom requis." }),
  prenom: z.string().min(1, { error: "Prénom requis." }),
  email: z.email({ error: "Email invalide." }),
  telephone: z.string().optional(),
  apport_personnel: z.coerce.number().positive().optional(),
  ville_id: z.string().uuid().optional(),
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
    statut: formData.get("statut"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("candidats").insert({
    ...parsed.data,
    telephone: parsed.data.telephone ?? null,
    apport_personnel: parsed.data.apport_personnel ?? null,
    ville_id: parsed.data.ville_id ?? null,
    zone_souhaitee: parsed.data.zone_souhaitee ?? null,
    notes: parsed.data.notes ?? null,
    created_by: session.id,
  });

  if (error) return { error: error.message };

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
    statut: formData.get("statut"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidats")
    .update({
      ...parsed.data,
      telephone: parsed.data.telephone ?? null,
      apport_personnel: parsed.data.apport_personnel ?? null,
      ville_id: parsed.data.ville_id ?? null,
      zone_souhaitee: parsed.data.zone_souhaitee ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/candidats");
  redirect("/candidats");
}

export async function inviteCandidat(
  candidatId: string
): Promise<{ error?: string }> {
  await requireRole("admin");

  if (!process.env.SUPABASE_SECRET_KEY) {
    return { error: "SUPABASE_SECRET_KEY manquante." };
  }

  const supabase = await createClient();
  const { data: candidat, error: fetchError } = await supabase
    .from("candidats")
    .select("id, nom, prenom, email, profil_id")
    .eq("id", candidatId)
    .single();

  if (fetchError || !candidat) return { error: "Candidat introuvable." };
  if (candidat.profil_id) return { error: "Ce candidat a déjà un compte." };

  const service = createServiceClient();

  const { data: invited, error: inviteError } =
    await service.auth.admin.inviteUserByEmail(candidat.email);

  if (inviteError || !invited.user) {
    return { error: `Invitation impossible : ${inviteError?.message ?? "erreur inconnue"}.` };
  }

  const { error: profileError } = await service.from("profiles").insert({
    id: invited.user.id,
    role: "franchise",
    nom: candidat.nom,
    prenom: candidat.prenom,
    email: candidat.email,
  });

  if (profileError) {
    return { error: `Profil non créé : ${profileError.message}.` };
  }

  const { error: linkError } = await supabase
    .from("candidats")
    .update({ profil_id: invited.user.id, statut: "signe" })
    .eq("id", candidatId);

  if (linkError) return { error: linkError.message };

  revalidatePath("/candidats");
  revalidatePath(`/candidats/${candidatId}`);
  return {};
}
