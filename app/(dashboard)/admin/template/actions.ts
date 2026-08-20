"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type ImportTemplateState = { error?: string; ok?: boolean; count?: number } | undefined;

// Colonnes attendues dans le fichier Excel exporté
const PHASE_MAP: Record<string, string> = {
  "administratif & financement": "administratif_financement",
  "communication": "communication",
  "ressources humaines": "ressources_humaines",
  "travaux, aménagement & mobilier": "travaux_amenagement",
  "formation": "formation",
  "stock & fournisseurs": "stock_fournisseurs",
  "ouverture": "ouverture",
};


export async function importTemplate(
  _state: ImportTemplateState,
  formData: FormData
): Promise<ImportTemplateState> {
  await requireRole("admin");

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Aucun fichier." };

  const bytes = await file.arrayBuffer();
  // On importe xlsx côté serveur (Node.js)
  const XLSX = await import("xlsx");
  const wb = XLSX.read(bytes, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);

  if (!rows.length) return { error: "Fichier vide ou format invalide." };

  const etapes = rows.map((row, i) => {
    const phaseLabel = String(row["Phase"] ?? "").toLowerCase().trim();
    const phase = PHASE_MAP[phaseLabel];
    const nom = String(row["Nom de l'étape"] ?? "").trim();

    if (!phase) return null;
    if (!nom) return null;

    return {
      phase,
      nom,
      ordre: Number(row["Ordre"] ?? i + 1),
      responsable: "mc", // valeur par défaut, ajustable manuellement par projet
      delai_semaines: null,
    };
  }).filter((e): e is NonNullable<typeof e> => e !== null);

  if (!etapes.length) return { error: "Aucune étape valide trouvée. Vérifiez les colonnes Phase et Nom de l'étape." };

  const supabase = await createClient();

  // Remplace tout le template
  const { error: delError } = await supabase.from("etapes_template").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) return { error: `Suppression : ${delError.message}` };

  const { error: insError } = await supabase.from("etapes_template").insert(etapes);
  if (insError) return { error: `Insertion : ${insError.message}` };

  revalidatePath("/admin/template");
  return { ok: true, count: etapes.length };
}
