"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { createServiceClient } from "@/lib/supabase/service";

const CreateUserSchema = z.object({
  email: z.email({ error: "Adresse email invalide." }),
  nom: z.string().min(1, { error: "Nom requis." }),
  prenom: z.string().min(1, { error: "Prénom requis." }),
  role: z.enum(["admin", "consultant", "franchise"], { error: "Rôle invalide." }),
  telephone: z.string().optional(),
});

export type CreateUserState = { error?: string; success?: string } | undefined;

export async function createUser(
  _state: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await requireRole("admin");

  if (!process.env.SUPABASE_SECRET_KEY) {
    return {
      error:
        "Configuration serveur incomplète : la clé secrète Supabase (SUPABASE_SECRET_KEY) n'est pas définie.",
    };
  }

  const parsed = CreateUserSchema.safeParse({
    email: formData.get("email"),
    nom: formData.get("nom"),
    prenom: formData.get("prenom"),
    role: formData.get("role"),
    telephone: formData.get("telephone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { email, nom, prenom, role, telephone } = parsed.data;
  const service = createServiceClient();

  const { data: invited, error: inviteError } =
    await service.auth.admin.inviteUserByEmail(email);

  if (inviteError || !invited.user) {
    return {
      error: `Impossible d'inviter ce compte : ${inviteError?.message ?? "erreur inconnue"}.`,
    };
  }

  const { error: profileError } = await service.from("profiles").insert({
    id: invited.user.id,
    role,
    nom,
    prenom,
    email,
    telephone: telephone || null,
  });

  if (profileError) {
    return {
      error: `Compte invité mais profil non enregistré : ${profileError.message}.`,
    };
  }

  revalidatePath("/admin/users");
  return {
    success: `Invitation envoyée à ${email}. Le compte sera actif dès qu'il aura défini son mot de passe.`,
  };
}
