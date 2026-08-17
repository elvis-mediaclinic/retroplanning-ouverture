import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { STATUT_VILLE_LABELS } from "@/lib/types";
import { STATUT_VILLE_COLORS } from "@/lib/utils";

export default async function VillesPage() {
  await requireMC();
  const supabase = await createClient();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retroplanning-ouverture.vercel.app";

  const { data: villes } = await supabase
    .from("villes")
    .select("id, nom, departement, region, population, statut, annonces(id, actif), candidatures(id)")
    .order("nom");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Villes</h1>
          <p className="text-sm text-zinc-500">Villes en cours de prospection</p>
        </div>
        <Link
          href="/villes/new"
          className="btn-primary"
        >
          + Ajouter
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
              <th className="py-2 px-4 font-medium text-zinc-600">Ville</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Dép. / Région</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Population</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Statut</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Annonce</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Candidatures</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {(villes ?? []).map((v) => {
              const annonces = v.annonces as unknown as Array<{ id: string; actif: boolean }> | null;
              const annonce = annonces?.[0] ?? null;
              const candidatures = v.candidatures as unknown as Array<{ id: string }> | null;
              const nbCandidatures = candidatures?.length ?? 0;

              return (
                <tr key={v.id} className="border-b border-zinc-100 last:border-0">
                  <td className="py-2 px-4 font-medium text-zinc-900">{v.nom}</td>
                  <td className="py-2 px-4 text-zinc-500">
                    {[v.departement, v.region].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="py-2 px-4 text-zinc-500">
                    {v.population ? v.population.toLocaleString("fr-FR") : "—"}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUT_VILLE_COLORS[v.statut as keyof typeof STATUT_VILLE_COLORS]
                      }`}
                    >
                      {STATUT_VILLE_LABELS[v.statut as keyof typeof STATUT_VILLE_LABELS]}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    {annonce ? (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          annonce.actif ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                        }`}>
                          {annonce.actif ? "Publiée" : "Brouillon"}
                        </span>
                        {annonce.actif && (
                          <a
                            href={`${baseUrl}/annonce/${annonce.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand hover:text-brand-dark"
                          >
                            Voir ↗
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {nbCandidatures > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                        {nbCandidatures}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <Link
                      href={`/villes/${v.id}`}
                      className="text-xs text-zinc-500 hover:text-zinc-900"
                    >
                      Éditer
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(villes ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 px-4 text-center text-zinc-400">
                  Aucune ville pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
