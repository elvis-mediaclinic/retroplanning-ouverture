import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Magasin, Franchise, MagasinSiret, MagasinCession } from "@/lib/types";
import { MagasinForm } from "../MagasinForm";
import { DeleteMagasinButton } from "./DeleteMagasinButton";
import { CessionModal } from "./CessionModal";

const TYPE_CESSION_LABELS: Record<string, string> = {
  franchise_a_franchise: "Franchisé → Franchisé",
  integre_a_franchise:   "Intégré → Franchisé",
  franchise_a_integre:   "Franchisé → Intégré",
};

export default async function EditMagasinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data },
    { data: franchisesData },
    { data: siretsData },
    { data: cessionsData },
  ] = await Promise.all([
    supabase.from("magasins").select("*").eq("id", id).single(),
    supabase.from("franchises").select("*").order("nom"),
    supabase.from("magasin_sirets").select("*").eq("magasin_id", id).order("date_debut", { ascending: false }),
    supabase.from("magasin_cessions").select("*").eq("magasin_id", id).order("date_cession", { ascending: false }),
  ]);

  if (!data) notFound();

  const magasin = data as Magasin;
  const franchises = (franchisesData ?? []) as Franchise[];
  const sirets = (siretsData ?? []) as MagasinSiret[];
  const cessions = (cessionsData ?? []) as MagasinCession[];

  const siretActuel = sirets.find((s) => s.date_fin === null)?.siret ?? null;

  // Map franchise id → nom pour l'historique
  const franchiseMap = Object.fromEntries(franchises.map((f) => [f.id, f.nom]));

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <h1 className="page-header-title">{magasin.nom}</h1>
        <div className="flex items-center gap-2">
          <CessionModal magasin={magasin} franchises={franchises} siretActuel={siretActuel} />
          <DeleteMagasinButton id={id} />
        </div>
      </div>
      <div>
        <a href="/reseau" className="text-sm text-zinc-500 hover:text-zinc-900">← Réseau</a>
      </div>

      <MagasinForm magasin={magasin} franchises={franchises} siretActuel={siretActuel} />

      {/* Historique des SIRET */}
      {sirets.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Historique des SIRET</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400">
                <th className="pb-2 font-medium">SIRET</th>
                <th className="pb-2 font-medium">Depuis</th>
                <th className="pb-2 font-medium">Jusqu&apos;au</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sirets.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 font-mono text-zinc-800">
                    {s.siret}
                    {s.date_fin === null && (
                      <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Actuel</span>
                    )}
                  </td>
                  <td className="py-2 text-zinc-500">{new Date(s.date_debut).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2 text-zinc-400">
                    {s.date_fin ? new Date(s.date_fin).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Historique des cessions */}
      {cessions.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Historique des cessions</h2>
          <div className="space-y-3">
            {cessions.map((c) => (
              <div key={c.id} className="rounded-md border border-zinc-100 bg-zinc-50 p-4 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-800">
                    {TYPE_CESSION_LABELS[c.type_cession] ?? c.type_cession}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(c.date_cession).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {c.franchise_cedant_id && (
                  <p className="text-zinc-500">
                    Cédant : <span className="text-zinc-700">{franchiseMap[c.franchise_cedant_id] ?? c.franchise_cedant_id}</span>
                  </p>
                )}
                {c.franchise_repreneur_id && (
                  <p className="text-zinc-500">
                    Repreneur : <span className="text-zinc-700">{franchiseMap[c.franchise_repreneur_id] ?? c.franchise_repreneur_id}</span>
                  </p>
                )}
                {c.nouveau_siret && (
                  <p className="text-zinc-500">
                    Nouveau SIRET : <span className="font-mono text-zinc-700">{c.nouveau_siret}</span>
                  </p>
                )}
                {c.notes && <p className="text-zinc-400 italic">{c.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
