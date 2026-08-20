import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PHASE_LABELS, STATUT_ETAPE_LABELS } from "@/lib/types";
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

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide w-8">#</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Phase</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Étape</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Responsable</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">Délai (sem.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(etapes ?? []).map((e) => (
              <tr key={e.id} className="hover:bg-zinc-50">
                <td className="px-4 py-2 text-zinc-400">{e.ordre}</td>
                <td className="px-4 py-2 text-zinc-500 text-xs">{PHASE_LABELS[e.phase as keyof typeof PHASE_LABELS] ?? e.phase}</td>
                <td className="px-4 py-2 font-medium text-zinc-900">{e.nom}</td>
                <td className="px-4 py-2 text-zinc-600 capitalize">{e.responsable}</td>
                <td className="px-4 py-2 text-right text-zinc-500">{e.delai_semaines ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!etapes?.length && (
          <p className="text-center py-8 text-sm text-zinc-400">Aucune étape dans le template.</p>
        )}
      </div>
    </div>
  );
}
