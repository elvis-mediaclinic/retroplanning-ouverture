"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { FranchiseAsssocie } from "@/lib/types";

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
    associes,
    notes: (formData.get("notes") as string).trim() || null,
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

  const payload = {
    nom,
    franchise_id: (formData.get("franchise_id") as string) || null,
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

  if (id) {
    const { error } = await supabase.from("magasins").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("magasins").insert(payload);
    if (error) return { error: error.message };
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
