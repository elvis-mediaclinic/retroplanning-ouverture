import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import {
  FORMAT_LABELS,
  TYPE_LABELS,
  STATUT_PROJET_LABELS,
} from "@/lib/types";
import { STATUT_PROJET_COLORS, formatDate } from "@/lib/utils";

export default async function ProjetsPage() {
  await requireMC();
  const supabase = await createClient();

  const { data: projets } = await supabase
    .from("projets")
    .select(
      `id, nom, type_magasin, format_magasin, statut, date_cible_ouverture,
       villes(nom), candidats(nom, prenom)`
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Ouvertures</h1>
          <p className="text-sm text-zinc-500">
            Tous les dossiers d&apos;ouverture
          </p>
        </div>
        <Link
          href="/projets/new"
          className="btn-primary"
        >
          + Nouveau projet
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
              <th className="py-2 px-4 font-medium text-zinc-600">Projet</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Format</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Ville</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Franchisé</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Statut</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Ouverture</th>
            </tr>
          </thead>
          <tbody>
            {(projets ?? []).map((p) => {
              const villeRaw = p.villes as unknown;
              const ville = Array.isArray(villeRaw) ? (villeRaw[0] as { nom: string } | undefined) ?? null : (villeRaw as { nom: string } | null);
              const candidatRaw = p.candidats as unknown;
              const candidat = Array.isArray(candidatRaw) ? (candidatRaw[0] as { nom: string; prenom: string } | undefined) ?? null : (candidatRaw as { nom: string; prenom: string } | null);
              return (
                <tr
                  key={p.id}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="py-2 px-4">
                    <Link
                      href={`/projets/${p.id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {p.nom}
                    </Link>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {TYPE_LABELS[p.type_magasin as keyof typeof TYPE_LABELS]}
                    </div>
                  </td>
                  <td className="py-2 px-4 text-zinc-600">
                    {FORMAT_LABELS[p.format_magasin as keyof typeof FORMAT_LABELS]}
                  </td>
                  <td className="py-2 px-4 text-zinc-500">
                    {ville?.nom ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="py-2 px-4 text-zinc-500">
                    {candidat
                      ? `${candidat.prenom} ${candidat.nom}`
                      : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUT_PROJET_COLORS[p.statut as keyof typeof STATUT_PROJET_COLORS]
                      }`}
                    >
                      {STATUT_PROJET_LABELS[p.statut as keyof typeof STATUT_PROJET_LABELS]}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-zinc-500">
                    {formatDate(p.date_cible_ouverture)}
                  </td>
                </tr>
              );
            })}
            {(projets ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-6 px-4 text-center text-zinc-400"
                >
                  Aucun projet.{" "}
                  <Link
                    href="/projets/new"
                    className="text-zinc-600 underline"
                  >
                    Créer le premier
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
