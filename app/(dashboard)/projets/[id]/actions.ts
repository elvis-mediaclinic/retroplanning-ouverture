"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const RESPONSABLE = ["franchise", "mc", "externe", "les_deux"] as const;

const UpdateEtapeSchema = z.object({
  nom: z.string().min(1),
  responsable: z.enum(RESPONSABLE),
  resp_mc: z.string().optional(),
  resp_franchise: z.string().optional(),
  statut: z.enum(["a_faire", "en_cours", "fait", "en_retard", "na"]),
  date_realisation: z.string().optional(),
  lien_document: z.string().url({ message: "URL invalide." }).optional().or(z.literal("")),
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
    nom: formData.get("nom"),
    responsable: formData.get("responsable") || "franchise",
    resp_mc: formData.get("resp_mc") || undefined,
    resp_franchise: formData.get("resp_franchise") || undefined,
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
      nom: parsed.data.nom,
      responsable: parsed.data.responsable,
      resp_mc: parsed.data.resp_mc || null,
      resp_franchise: parsed.data.resp_franchise || null,
      statut: parsed.data.statut,
      date_realisation: parsed.data.date_realisation ?? null,
      lien_document: parsed.data.lien_document || null,
      commentaire: parsed.data.commentaire ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", etapeId);

  if (error) return { error: error.message };

  revalidatePath(`/projets/${projetId}`);
  revalidatePath(`/mon-projet`);
  return {};
}

export async function addEtape(
  projetId: string,
  _state: EtapeState,
  formData: FormData
): Promise<EtapeState> {
  await verifySession();

  const nom = (formData.get("nom") as string)?.trim();
  const phase = formData.get("phase") as string;
  const responsable = (formData.get("responsable") as string) || "franchise";
  const resp_mc = (formData.get("resp_mc") as string) || null;
  const resp_franchise = (formData.get("resp_franchise") as string) || null;

  if (!nom) return { error: "Le nom est requis." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("etapes_projet")
    .select("ordre")
    .eq("projet_id", projetId)
    .eq("phase", phase)
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrdre = (existing?.ordre ?? 0) + 1;

  const { error } = await supabase.from("etapes_projet").insert({
    projet_id: projetId,
    phase,
    nom,
    responsable,
    resp_mc,
    resp_franchise,
    ordre: nextOrdre,
    statut: "a_faire",
  });

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
