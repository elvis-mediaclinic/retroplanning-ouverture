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
    .select("id, role, nom, prenom, email, telephone, created_at")
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

// Équipe MC interne : admin, consultant, responsable_mc.
export async function requireMC() {
  return requireRole("admin", "consultant", "responsable_mc");
}
