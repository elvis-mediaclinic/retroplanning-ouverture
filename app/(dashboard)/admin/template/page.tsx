import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PHASE_LABELS } from "@/lib/types";

const PHASES_ORDER = [
  "administratif_financement",
  "communication",
  "ressources_humaines",
  "travaux_amenagement",
  "formation",
  "stock_fournisseurs",
  "ouverture",
] as const;
import { ImportTemplateForm } from "./ImportTemplateForm";

export default async function TemplatePage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: etapes } = await supabase
    .from("etapes_template")
    .select("*")
    .order("ordre");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Template retroplanning</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ces étapes sont copiées lors de la création de chaque nouveau projet.
        </p>
      </div>

      <ImportTemplateForm />

      {!etapes?.length ? (
        <p className="text-center py-8 text-sm text-zinc-400">Aucune étape dans le template.</p>
      ) : (
        <div className="space-y-4">
          {PHASES_ORDER.map((phase) => {
            const rows = (etapes ?? [])
              .filter((e) => e.phase === phase)
              .sort((a, b) => a.ordre - b.ordre);
            if (!rows.length) return null;
            return (
              <div key={phase} className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    {PHASE_LABELS[phase]}
                  </p>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-zinc-100">
                    {rows.map((e) => (
                      <tr key={e.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-2 text-zinc-400 w-8 text-right tabular-nums">{e.ordre}</td>
                        <td className="px-4 py-2 text-zinc-900">{e.nom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
