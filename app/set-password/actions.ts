"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { error: "Le mot de passe doit faire au moins 8 caractères." }),
});

export type SetPasswordState = { error?: string } | undefined;

export async function setPassword(
  _state: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const parsed = SetPasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: `Impossible de définir le mot de passe : ${error.message}.` };
  }

  redirect("/");
}
