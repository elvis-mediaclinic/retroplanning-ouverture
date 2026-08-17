"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const UpdateEtapeSchema = z.object({
  statut: z.enum(["a_faire", "en_cours", "fait", "en_retard", "na"]),
  date_realisation: z.string().optional(),
  lien_document: z.string().url({ message: "URL invalide." }).optional(),
  commentaire: z.string().optional(),
});

export type EtapeState = { error?: string } | undefined;

export async function updateEtape(
  etapeId: string,
  projetId: string,
  _state: EtapeState,
  formData: FormData
): Promise<EtapeState> {
  await verifySession();

  const parsed = UpdateEtapeSchema.safeParse({
    statut: formData.get("statut"),
    date_realisation: formData.get("date_realisation") || undefined,
    lien_document: formData.get("lien_document") || undefined,
    commentaire: formData.get("commentaire") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("etapes_projet")
    .update({
      statut: parsed.data.statut,
      date_realisation: parsed.data.date_realisation ?? null,
      lien_document: parsed.data.lien_document ?? null,
      commentaire: parsed.data.commentaire ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", etapeId);

  if (error) return { error: error.message };

  revalidatePath(`/projets/${projetId}`);
  revalidatePath(`/mon-projet`);
  return {};
}

export async function addCommentaire(
  projetId: string,
  etapeId: string | null,
  _state: EtapeState,
  formData: FormData
): Promise<EtapeState> {
  const session = await verifySession();
  const contenu = formData.get("contenu") as string;

  if (!contenu?.trim()) return { error: "Le commentaire ne peut pas être vide." };

  const supabase = await createClient();
  const { error } = await supabase.from("commentaires").insert({
    projet_id: projetId,
    etape_id: etapeId,
    auteur_id: session.userId,
    contenu: contenu.trim(),
  });

  if (error) return { error: error.message };

  revalidatePath(`/projets/${projetId}`);
  revalidatePath(`/mon-projet`);
  return {};
}
