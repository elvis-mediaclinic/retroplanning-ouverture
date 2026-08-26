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

  const [{ data: projets }, { data: etapes }] = await Promise.all([
    supabase
      .from("projets")
      .select(`id, nom, type_magasin, format_magasin, statut, date_cible_ouverture, villes(nom), candidats(nom, prenom)`)
      .order("created_at", { ascending: false }),
    supabase
      .from("etapes_projet")
      .select("projet_id, statut, date_cible"),
  ]);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  function statsForProjet(projetId: string) {
    const all = (etapes ?? []).filter((e) => e.projet_id === projetId);
    const total = all.length;
    const faites = all.filter((e) => e.statut === "fait" || e.statut === "na").length;
    const progression = total > 0 ? Math.round((faites / total) * 100) : 0;

    const actives = all.filter((e) => e.statut !== "fait" && e.statut !== "na");
    const retard = actives.filter((e) => {
      if (!e.date_cible) return false;
      return new Date(e.date_cible + "T00:00:00") < today;
    }).length;
    const aFaire = actives.filter((e) => {
      if (!e.date_cible) return false;
      const d = new Date(e.date_cible + "T00:00:00");
      return d <= today;
    }).length;

    return { progression, total, retard, aFaire };
  }

  return (
    <div className="space-y-6">
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase text-[#0089bd]">Ouvertures</h1>
          <p className="mt-1 text-sm text-zinc-500">Tous les dossiers d&apos;ouverture</p>
        </div>
        <Link href="/projets/new" className="btn-primary">+ Nouveau projet</Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
              <th className="py-2 px-4 font-medium text-white">Projet</th>
              <th className="py-2 px-4 font-medium text-white">Ville</th>
              <th className="py-2 px-4 font-medium text-white">Franchisé</th>
              <th className="py-2 px-4 font-medium text-white">Statut</th>
              <th className="py-2 px-4 font-medium text-white">Ouverture</th>
              <th className="py-2 px-4 font-medium text-white">Progression</th>
              <th className="py-2 px-4 font-medium text-white">À faire</th>
            </tr>
          </thead>
          <tbody>
            {(projets ?? []).map((p) => {
              const villeRaw = p.villes as unknown;
              const ville = Array.isArray(villeRaw) ? (villeRaw[0] as { nom: string } | undefined) ?? null : (villeRaw as { nom: string } | null);
              const candidatRaw = p.candidats as unknown;
              const candidat = Array.isArray(candidatRaw) ? (candidatRaw[0] as { nom: string; prenom: string } | undefined) ?? null : (candidatRaw as { nom: string; prenom: string } | null);
              const { progression, total, retard, aFaire } = statsForProjet(p.id);

              return (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0 align-middle">
                  <td className="py-3 px-4">
                    <Link href={`/projets/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                      {p.nom}
                    </Link>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {TYPE_LABELS[p.type_magasin as keyof typeof TYPE_LABELS]} · {FORMAT_LABELS[p.format_magasin as keyof typeof FORMAT_LABELS]}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-500">
                    {ville?.nom ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="py-3 px-4 text-zinc-500">
                    {candidat ? `${candidat.prenom} ${candidat.nom}` : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_PROJET_COLORS[p.statut as keyof typeof STATUT_PROJET_COLORS]}`}>
                      {STATUT_PROJET_LABELS[p.statut as keyof typeof STATUT_PROJET_LABELS]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-500 text-xs">
                    {formatDate(p.date_cible_ouverture)}
                  </td>
                  <td className="py-3 px-4">
                    {total > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${progression}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500">{progression}%</span>
                      </div>
                    ) : (
                      <span className="text-zinc-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {aFaire > 0 && (
                        <span className="text-xs text-zinc-600">{aFaire} à faire</span>
                      )}
                      {retard > 0 && (
                        <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">
                          ⚠️ {retard} en retard
                        </span>
                      )}
                      {aFaire === 0 && retard === 0 && (
                        <span className="text-zinc-300 text-xs">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(projets ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 px-4 text-center text-zinc-400">
                  Aucun projet.{" "}
                  <Link href="/projets/new" className="text-zinc-600 underline">Créer le premier</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
