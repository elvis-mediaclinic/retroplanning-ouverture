import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { isAuth: true as const, userId: user.id, email: user.email };
});

export const getProfile = cache(async (): Promise<Profile> => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, nom, prenom, email, telephone, fonction, created_at")
    .eq("id", session.userId)
    .single();

  if (error || !data) {
    redirect("/login");
  }

  return data;
});

export async function requireRole(...roles: Profile["role"][]) {
  const profile = await getProfile();
  // L'admin est un superset de tous les rôles.
  if (profile.role !== "admin" && !roles.includes(profile.role)) {
    redirect("/");
  }
  return profile;
}

// Équipe MC interne (accès en écriture) : admin, responsable_mc.
// Le consultant n'en fait plus partie — il est en lecture seule et scopé à
// ce qu'il a lui-même apporté (cf. migration 0041_consultant_readonly).
export async function requireMC() {
  return requireRole("admin", "responsable_mc");
}

// Équipe MC + consultant (lecture, éventuellement restreinte par les
// policies RLS elles-mêmes — villes, candidats, ouvertures).
export async function requireMCOrConsultant() {
  return requireRole("admin", "consultant", "responsable_mc");
}

// Admin ou responsable_mc avec fonction contenant "marketing" (insensible à la casse).
export async function requireMarketing() {
  const profile = await getProfile();
  const isMarketing =
    profile.role === "admin" ||
    (profile.role === "responsable_mc" &&
      profile.fonction?.toLowerCase().includes("marketing"));
  if (!isMarketing) redirect("/");
  return profile;
}

// Comme requireMarketing(), mais laisse aussi passer le consultant (lecture
// seule — les policies RLS le limitent déjà aux annonces publiées).
export async function requireMarketingOrConsultant() {
  const profile = await getProfile();
  const isMarketing =
    profile.role === "admin" ||
    (profile.role === "responsable_mc" &&
      profile.fonction?.toLowerCase().includes("marketing"));
  if (!isMarketing && profile.role !== "consultant") redirect("/");
  return profile;
}
