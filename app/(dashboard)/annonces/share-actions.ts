"use server";

import { revalidatePath } from "next/cache";
import { requireMarketing } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type ShareState = { error?: string; ok?: boolean } | undefined;

export async function setAnnonceConsultants(
  annonceId: string,
  _state: ShareState,
  formData: FormData
): Promise<ShareState> {
  await requireMarketing();
  const supabase = await createClient();

  const consultantIds = formData.getAll("consultant_ids") as string[];

  const { error: deleteError } = await supabase
    .from("annonce_consultants")
    .delete()
    .eq("annonce_id", annonceId);
  if (deleteError) return { error: deleteError.message };

  if (consultantIds.length > 0) {
    const { error: insertError } = await supabase
      .from("annonce_consultants")
      .insert(consultantIds.map((consultant_id) => ({ annonce_id: annonceId, consultant_id })));
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/annonces");
  return { ok: true };
}
