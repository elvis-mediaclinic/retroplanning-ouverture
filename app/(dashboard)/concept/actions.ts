"use server";

import { revalidatePath } from "next/cache";
import { requireMarketing } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type ConceptState = { error?: string; ok?: boolean } | undefined;

export async function saveConcept(
  _state: ConceptState,
  formData: FormData
): Promise<ConceptState> {
  await requireMarketing();
  const supabase = await createClient();

  const sectionsRaw = formData.get("sections") as string | null;
  if (!sectionsRaw) return { error: "Aucun contenu." };

  const { error } = await supabase.from("pages").upsert({
    key: "concept",
    sections: JSON.parse(sectionsRaw),
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });

  if (error) return { error: error.message };

  revalidatePath("/concept");
  return { ok: true };
}
