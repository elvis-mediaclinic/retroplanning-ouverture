"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const RESPONSABLE = ["franchise", "mc", "externe", "les_deux"] as const;

const UpdateEtapeSchema = z.object({
  nom: z.string().min(1),
  responsable: z.enum(RESPONSABLE),
  resp_mc: z.array(z.string()).optional(),
  resp_franchise: z.string().optional(),
  resp_externe: z.string().optional(),
  statut: z.enum(["a_faire", "en_cours", "fait", "en_retard", "na"]),
  date_cible: z.string().optional(),
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
    resp_mc: formData.getAll("resp_mc").filter(Boolean) as string[],
    resp_franchise: formData.get("resp_franchise") || undefined,
    resp_externe: formData.get("resp_externe") || undefined,
    statut: formData.get("statut"),
    date_cible: formData.get("date_cible") || undefined,
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
      resp_mc: parsed.data.resp_mc && parsed.data.resp_mc.length > 0 ? parsed.data.resp_mc : null,
      resp_franchise: parsed.data.resp_franchise || null,
      resp_externe: parsed.data.resp_externe || null,
      statut: parsed.data.statut,
      date_cible: parsed.data.date_cible ?? null,
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
  const resp_mc = formData.getAll("resp_mc").filter(Boolean) as string[];
  const resp_mc_val = resp_mc.length > 0 ? resp_mc : null;
  const resp_franchise = (formData.get("resp_franchise") as string) || null;
  const resp_externe = (formData.get("resp_externe") as string) || null;

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
    resp_mc: resp_mc_val,
    resp_franchise,
    resp_externe,
    ordre: nextOrdre,
    statut: "a_faire",
  });

  if (error) return { error: error.message };

  revalidatePath(`/projets/${projetId}`);
  revalidatePath(`/mon-projet`);
  return {};
}

export async function reorderEtapes(
  projetId: string,
  orderedIds: string[]
): Promise<void> {
  await verifySession();
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("etapes_projet").update({ ordre: index + 1 }).eq("id", id)
    )
  );
  revalidatePath(`/projets/${projetId}`);
  revalidatePath(`/mon-projet`);
}

export async function updateDateCible(
  etapeId: string,
  projetId: string,
  dateCible: string
): Promise<void> {
  await verifySession();
  const supabase = await createClient();
  await supabase
    .from("etapes_projet")
    .update({ date_cible: dateCible, updated_at: new Date().toISOString() })
    .eq("id", etapeId);
  revalidatePath(`/projets/${projetId}`);
  revalidatePath(`/projets/${projetId}/gantt`);
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
