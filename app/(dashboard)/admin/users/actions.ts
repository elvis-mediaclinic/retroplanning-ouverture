"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { createServiceClient } from "@/lib/supabase/service";

const CreateUserSchema = z.object({
  email: z.email({ error: "Adresse email invalide." }),
  nom: z.string().min(1, { error: "Nom requis." }),
  prenom: z.string().min(1, { error: "Prénom requis." }),
  role: z.enum(["admin", "consultant", "franchise", "responsable_mc"], { error: "Rôle invalide." }),
  telephone: z.string().optional(),
  fonction: z.string().optional(),
});

export type CreateUserState = { error?: string; success?: string; inviteLink?: string; personName?: string } | undefined;

export async function updateUser(
  userId: string,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  await requireRole("admin");
  const role = formData.get("role") as string;
  const fonction = (formData.get("fonction") as string)?.trim() || null;

  const validRoles = ["admin", "consultant", "franchise", "responsable_mc"];
  if (!validRoles.includes(role)) return { error: "Rôle invalide." };

  const service = createServiceClient();
  const { error } = await service.from("profiles").update({ role, fonction }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
}

export async function createUser(
  _state: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await requireRole("admin");

  if (!process.env.SUPABASE_SECRET_KEY) {
    return { error: "Configuration serveur incomplète : SUPABASE_SECRET_KEY manquante." };
  }

  const parsed = CreateUserSchema.safeParse({
    email: formData.get("email"),
    nom: formData.get("nom"),
    prenom: formData.get("prenom"),
    role: formData.get("role"),
    telephone: formData.get("telephone") || undefined,
    fonction: formData.get("fonction") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { email, nom, prenom, role, telephone, fonction } = parsed.data;
  const service = createServiceClient();

  // generateLink crée le compte et retourne le lien directement — pas de dépendance SMTP
  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: "invite",
    email,
  });

  if (linkError || !linkData.user) {
    return { error: `Impossible de créer le compte : ${linkError?.message ?? "erreur inconnue"}.` };
  }

  const { error: profileError } = await service.from("profiles").insert({
    id: linkData.user.id,
    role,
    nom,
    prenom,
    email,
    telephone: telephone || null,
    fonction: fonction || null,
  });

  if (profileError) {
    return { error: `Compte créé mais profil non enregistré : ${profileError.message}.` };
  }

  revalidatePath("/admin/users");
  return {
    inviteLink: linkData.properties.action_link,
    personName: `${prenom} ${nom}`,
  };
}
