"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { calcDateCible } from "@/lib/utils";

const ProjetSchema = z.object({
  nom: z.string().min(1, { error: "Nom requis." }),
  type_magasin: z.enum(["integre", "franchise"]),
  format_magasin: z.enum(["classique", "galerie", "centre_ville", "kiosque", "shop_in_shop"]),
  statut: z.enum(["prospection", "en_cours", "ouvert", "suspendu", "abandonne"]),
  ville_id: z.string().uuid().optional(),
  candidat_id: z.string().uuid().optional(),
  franchisee_id: z.string().uuid().optional(),
  date_cible_ouverture: z.string().optional(),
  surface_m2: z.coerce.number().int().positive().optional(),
  lien_sharepoint: z.string().url({ message: "URL invalide." }).optional(),
  notes: z.string().optional(),
});

export type ProjetState = { error?: string } | undefined;

export async function createProjet(
  _state: ProjetState,
  formData: FormData
): Promise<ProjetState> {
  const session = await requireMC();

  const parsed = ProjetSchema.safeParse({
    nom: formData.get("nom"),
    type_magasin: formData.get("type_magasin"),
    format_magasin: formData.get("format_magasin"),
    statut: formData.get("statut"),
    ville_id: formData.get("ville_id") || undefined,
    candidat_id: formData.get("candidat_id") || undefined,
    franchisee_id: formData.get("franchisee_id") || undefined,
    date_cible_ouverture: formData.get("date_cible_ouverture") || undefined,
    surface_m2: formData.get("surface_m2") || undefined,
    lien_sharepoint: formData.get("lien_sharepoint") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();

  const { data: projet, error: projetError } = await supabase
    .from("projets")
    .insert({
      ...parsed.data,
      ville_id: parsed.data.ville_id ?? null,
      candidat_id: parsed.data.candidat_id ?? null,
      franchisee_id: parsed.data.franchisee_id ?? null,
      date_cible_ouverture: parsed.data.date_cible_ouverture ?? null,
      surface_m2: parsed.data.surface_m2 ?? null,
      lien_sharepoint: parsed.data.lien_sharepoint ?? null,
      notes: parsed.data.notes ?? null,
      created_by: session.id,
    })
    .select("id")
    .single();

  if (projetError || !projet) {
    return { error: projetError?.message ?? "Erreur lors de la création." };
  }

  // Génération des étapes depuis le template
  const { data: template } = await supabase
    .from("etapes_template")
    .select("*")
    .order("ordre");

  if (template && template.length > 0) {
    const dateOuverture = parsed.data.date_cible_ouverture;
    const etapes = template.map((t) => ({
      projet_id: projet.id,
      template_id: t.id,
      phase: t.phase,
      nom: t.nom,
      responsable: t.responsable,
      ordre: t.ordre,
      statut: "a_faire" as const,
      date_cible:
        dateOuverture && t.delai_semaines !== null
          ? calcDateCible(dateOuverture, t.delai_semaines)
          : null,
    }));

    await supabase.from("etapes_projet").insert(etapes);
  }

  redirect(`/projets/${projet.id}`);
}

export async function updateProjet(
  id: string,
  _state: ProjetState,
  formData: FormData
): Promise<ProjetState> {
  await requireMC();

  const parsed = ProjetSchema.safeParse({
    nom: formData.get("nom"),
    type_magasin: formData.get("type_magasin"),
    format_magasin: formData.get("format_magasin"),
    statut: formData.get("statut"),
    ville_id: formData.get("ville_id") || undefined,
    candidat_id: formData.get("candidat_id") || undefined,
    franchisee_id: formData.get("franchisee_id") || undefined,
    date_cible_ouverture: formData.get("date_cible_ouverture") || undefined,
    surface_m2: formData.get("surface_m2") || undefined,
    lien_sharepoint: formData.get("lien_sharepoint") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projets")
    .update({
      ...parsed.data,
      ville_id: parsed.data.ville_id ?? null,
      candidat_id: parsed.data.candidat_id ?? null,
      franchisee_id: parsed.data.franchisee_id ?? null,
      date_cible_ouverture: parsed.data.date_cible_ouverture ?? null,
      surface_m2: parsed.data.surface_m2 ?? null,
      lien_sharepoint: parsed.data.lien_sharepoint ?? null,
      notes: parsed.data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  redirect(`/projets/${id}`);
}
