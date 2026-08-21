"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { FranchiseAsssocie, TypeCession } from "@/lib/types";

export type MagasinState = { error?: string } | undefined;
export type FranchiseState = { error?: string } | undefined;

// ─── Franchises ─────────────────────────────────────────────────────────────

export async function saveFranchise(
  id: string | null,
  _state: FranchiseState,
  formData: FormData
): Promise<FranchiseState> {
  await requireRole("admin");
  const supabase = await createClient();

  const nom = (formData.get("nom") as string).trim();
  if (!nom) return { error: "Nom requis." };

  const associes: FranchiseAsssocie[] = [];
  let i = 0;
  while (formData.has(`associes[${i}][prenom]`)) {
    const prenom = (formData.get(`associes[${i}][prenom]`) as string).trim();
    const assNom = (formData.get(`associes[${i}][nom]`) as string).trim();
    if (prenom || assNom) {
      associes.push({
        prenom,
        nom: assNom,
        telephone: (formData.get(`associes[${i}][telephone]`) as string).trim(),
        email: (formData.get(`associes[${i}][email]`) as string).trim(),
      });
    }
    i++;
  }

  const payload = {
    nom,
    raison_sociale: (formData.get("raison_sociale") as string).trim() || null,
    siren: (formData.get("siren") as string).trim() || null,
    rcs: (formData.get("rcs") as string).trim() || null,
    tva_intracom: (formData.get("tva_intracom") as string).trim() || null,
    associes,
    notes: (formData.get("notes") as string).trim() || null,
    archive: formData.getAll("archive").includes("1"),
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("franchises").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("franchises").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/reseau");
  redirect("/reseau/franchises");
}

export async function deleteFranchise(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  await supabase.from("franchises").delete().eq("id", id);
  revalidatePath("/reseau");
  redirect("/reseau/franchises");
}

// Action légère pour créer un franchisé depuis la modal du formulaire magasin
// Retourne les données au lieu de rediriger
export async function createFranchiseInline(
  formData: FormData
): Promise<{ id: string; nom: string } | { error: string }> {
  await requireRole("admin");
  const supabase = await createClient();

  const nom = (formData.get("nom") as string).trim();
  if (!nom) return { error: "Nom requis." };

  const associes: FranchiseAsssocie[] = [];
  let i = 0;
  while (formData.has(`associes[${i}][prenom]`)) {
    const prenom = (formData.get(`associes[${i}][prenom]`) as string).trim();
    const assNom = (formData.get(`associes[${i}][nom]`) as string).trim();
    if (prenom || assNom) {
      associes.push({
        prenom,
        nom: assNom,
        telephone: (formData.get(`associes[${i}][telephone]`) as string).trim(),
        email: (formData.get(`associes[${i}][email]`) as string).trim(),
      });
    }
    i++;
  }

  const { data, error } = await supabase
    .from("franchises")
    .insert({ nom, associes, updated_at: new Date().toISOString() })
    .select("id, nom")
    .single();

  if (error || !data) return { error: error?.message ?? "Erreur inconnue." };

  revalidatePath("/reseau");
  return { id: data.id, nom: data.nom };
}

// ─── Magasins ────────────────────────────────────────────────────────────────

export async function saveMagasin(
  id: string | null,
  projetId: string | null,
  _state: MagasinState,
  formData: FormData
): Promise<MagasinState> {
  await requireRole("admin");
  const supabase = await createClient();

  const nom = (formData.get("nom") as string).trim();
  if (!nom) return { error: "Nom requis." };

  const type = (formData.get("type") as string) === "integre" ? "integre" : "franchise";

  const archive = formData.getAll("archive").includes("1");

  const payload = {
    nom,
    type,
    franchise_id: type === "franchise" ? (formData.get("franchise_id") as string) || null : null,
    archive,
    date_fermeture: archive ? (formData.get("date_fermeture") as string) || null : null,
    adresse: (formData.get("adresse") as string).trim() || null,
    code_postal: (formData.get("code_postal") as string).trim() || null,
    ville: (formData.get("ville") as string).trim() || null,
    telephone: (formData.get("telephone") as string).trim() || null,
    email: (formData.get("email") as string).trim() || null,
    date_signature_contrat: (formData.get("date_signature_contrat") as string) || null,
    date_ouverture: (formData.get("date_ouverture") as string) || null,
    format: (formData.get("format") as string) || null,
    surface_m2: formData.get("surface_m2") ? Number(formData.get("surface_m2")) : null,
    notes: (formData.get("notes") as string).trim() || null,
    projet_id: projetId || null,
    updated_at: new Date().toISOString(),
  };

  const siret = (formData.get("siret") as string | null)?.trim() || null;

  if (id) {
    const { error } = await supabase.from("magasins").update(payload).eq("id", id);
    if (error) return { error: error.message };

    // Mettre à jour le SIRET actuel (date_fin = null) ou en créer un si inexistant
    if (siret !== null) {
      const { data: current } = await supabase
        .from("magasin_sirets")
        .select("id")
        .eq("magasin_id", id)
        .is("date_fin", null)
        .maybeSingle();

      if (current) {
        await supabase.from("magasin_sirets").update({ siret }).eq("id", current.id);
      } else if (siret) {
        await supabase.from("magasin_sirets").insert({
          magasin_id: id,
          siret,
          date_debut: (payload as Record<string, unknown>).date_ouverture as string ?? new Date().toISOString().slice(0, 10),
        });
      }
    }
  } else {
    const { data: created, error } = await supabase.from("magasins").insert(payload).select("id").single();
    if (error || !created) return { error: error?.message ?? "Erreur inconnue." };

    // Insérer le SIRET initial si fourni
    if (siret) {
      await supabase.from("magasin_sirets").insert({
        magasin_id: created.id,
        siret,
        date_debut: (payload as Record<string, unknown>).date_ouverture as string ?? new Date().toISOString().slice(0, 10),
      });
    }
  }

  revalidatePath("/reseau");
  if (projetId) revalidatePath(`/projets/${projetId}`);
  redirect("/reseau");
}

export async function deleteMagasin(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  await supabase.from("magasins").delete().eq("id", id);
  revalidatePath("/reseau");
  redirect("/reseau");
}

// ─── Cessions ────────────────────────────────────────────────────────────────

export type CessionState = { error?: string } | undefined;

export async function enregistrerCession(
  magasinId: string,
  _state: CessionState,
  formData: FormData
): Promise<CessionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const typeCession = formData.get("type_cession") as TypeCession;
  const dateCession = formData.get("date_cession") as string;
  if (!dateCession) return { error: "Date de cession requise." };
  if (!typeCession) return { error: "Type de cession requis." };

  // Résoudre le repreneur (existant ou nouveau franchisé à créer)
  let repreneurId: string | null = (formData.get("franchise_repreneur_id") as string) || null;
  const nouveauFranchiseNom = (formData.get("nouveau_franchise_nom") as string)?.trim();

  if (!repreneurId && nouveauFranchiseNom && typeCession !== "franchise_a_integre") {
    const { data: nf, error: nfErr } = await supabase
      .from("franchises")
      .insert({ nom: nouveauFranchiseNom, associes: [], updated_at: new Date().toISOString() })
      .select("id")
      .single();
    if (nfErr || !nf) return { error: "Impossible de créer le franchisé repreneur." };
    repreneurId = nf.id;
  }

  const cedantId = (formData.get("franchise_cedant_id") as string) || null;
  const nouveauSiret = (formData.get("nouveau_siret") as string)?.trim() || null;
  const ancienSiret = (formData.get("ancien_siret") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  // 1. Insérer la cession
  const { error: cessionErr } = await supabase.from("magasin_cessions").insert({
    magasin_id: magasinId,
    date_cession: dateCession,
    type_cession: typeCession,
    franchise_cedant_id: cedantId || null,
    franchise_repreneur_id: repreneurId,
    nouveau_siret: dejaAppliquee ? ancienSiret : nouveauSiret,
    notes,
  });
  if (cessionErr) return { error: cessionErr.message };

  // 2. Gestion des SIRET
  if (dejaAppliquee) {
    // Cession historique : insérer l'ancien SIRET comme entrée clôturée, sans toucher au SIRET actuel
    if (ancienSiret) {
      await supabase.from("magasin_sirets").insert({
        magasin_id: magasinId,
        siret: ancienSiret,
        date_debut: "1900-01-01",
        date_fin: dateCession,
      });
    }
  } else if (nouveauSiret) {
    // Cession courante : clôturer le SIRET actuel et insérer le nouveau
    await supabase
      .from("magasin_sirets")
      .update({ date_fin: dateCession })
      .eq("magasin_id", magasinId)
      .is("date_fin", null);

    await supabase.from("magasin_sirets").insert({
      magasin_id: magasinId,
      siret: nouveauSiret,
      date_debut: dateCession,
    });
  }

  // 3. Mettre à jour le magasin (type + franchisé) — sauf si cession déjà appliquée
  const dejaAppliquee = formData.get("deja_appliquee") === "1";
  if (!dejaAppliquee) {
    const nouveauType = typeCession === "franchise_a_integre" ? "integre" : "franchise";
    const nouvFranchiseId = typeCession === "franchise_a_integre" ? null : repreneurId;
    await supabase
      .from("magasins")
      .update({ type: nouveauType, franchise_id: nouvFranchiseId, updated_at: new Date().toISOString() })
      .eq("id", magasinId);
  }

  revalidatePath(`/reseau/${magasinId}`);
  revalidatePath("/reseau");
  return {};
}
