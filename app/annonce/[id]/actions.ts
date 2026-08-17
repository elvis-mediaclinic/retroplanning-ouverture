"use server";

import * as z from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  prenom: z.string().min(1, { error: "Prénom requis." }),
  nom: z.string().min(1, { error: "Nom requis." }),
  email: z.email({ error: "Email invalide." }),
  telephone: z.string().optional(),
  apport_personnel: z.coerce.number().positive().optional(),
  message: z.string().optional(),
});

export type CandidatureState = { error?: string; success?: boolean } | undefined;

export async function submitCandidature(
  annonceId: string,
  villeId: string,
  _state: CandidatureState,
  formData: FormData
): Promise<CandidatureState> {
  const parsed = Schema.safeParse({
    prenom: formData.get("prenom"),
    nom: formData.get("nom"),
    email: formData.get("email"),
    telephone: formData.get("telephone") || undefined,
    apport_personnel: formData.get("apport_personnel") || undefined,
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("candidatures").insert({
    annonce_id: annonceId,
    ville_id: villeId,
    ...parsed.data,
    telephone: parsed.data.telephone ?? null,
    apport_personnel: parsed.data.apport_personnel ?? null,
    message: parsed.data.message ?? null,
  });

  if (error) return { error: "Une erreur est survenue. Veuillez réessayer." };

  return { success: true };
}
