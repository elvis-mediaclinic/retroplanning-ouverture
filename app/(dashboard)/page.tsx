import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { STATUT_PROJET_LABELS, FORMAT_LABELS, type FormatMagasin } from "@/lib/types";
import { STATUT_PROJET_COLORS as COLORS } from "@/lib/utils";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function DashboardPage() {
  const profile = await getProfile();

  if (profile.role === "franchise") redirect("/mon-projet");

  const supabase = await createClient();

  const [
    { data: projets },
    { data: villes },
    { data: candidats },
    { data: magasinsRecents },
    { data: franchises },
    { data: allMagasins },
  ] = await Promise.all([
    supabase
      .from("projets")
      .select("id, nom, format_magasin, statut, date_cible_ouverture")
      .order("created_at", { ascending: false }),
    supabase.from("villes").select("id").eq("statut", "en_etude"),
    supabase.from("candidats").select("id").in("statut", ["prospect", "en_evaluation"]),
    supabase
      .from("magasins")
      .select("id, nom, ville, type, date_ouverture, franchises(nom)")
      .order("date_ouverture", { ascending: false })
      .limit(5),
    supabase.from("franchises").select("id"),
    supabase.from("magasins").select("id, type, format"),
  ]);

  const magasinList = allMagasins ?? [];
  const magasinTotal = magasinList.length;
  const integreCount = magasinList.filter((m) => m.type === "integre").length;
  const franchiseCount = magasinList.filter((m) => m.type === "franchise").length;

  // Répartition par format
  const formatCounts = Object.entries(FORMAT_LABELS).map(([key, label]) => ({
    key: key as FormatMagasin,
    label,
    count: magasinList.filter((m) => m.format === key).length,
  })).filter((f) => f.count > 0);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Suivi développement franchise</h1>
        <p className="mt-1 text-sm text-zinc-500">Bonjour {profile.prenom} !</p>
      </div>

      {/* Stats développement */}
      <div>
        <h2 className="mb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Développement</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Ouvertures en cours", value: (projets ?? []).filter((p) => ["prospection", "en_cours"].includes(p.statut)).length, href: "/projets" },
            { label: "Magasins ouverts", value: (projets ?? []).filter((p) => p.statut === "ouvert").length, href: "/projets" },
            { label: "Villes en étude", value: (villes ?? []).length, href: "/villes" },
            { label: "Candidats en cours", value: (candidats ?? []).length, href: "/candidats" },
          ].map(({ label, value, href }) => (
            <Link key={label} href={href}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-zinc-300 transition-colors">
              <p className="text-2xl font-bold text-zinc-900">{value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats réseau */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Réseau</h2>
          <Link href="/reseau" className="text-xs text-zinc-500 hover:text-zinc-900">Voir le réseau →</Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
          {[
            { label: "Magasins dans le réseau", value: magasinTotal },
            { label: "Magasins intégrés", value: integreCount },
            { label: "Magasins franchisés", value: franchiseCount },
            { label: "Franchisés", value: (franchises ?? []).length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-zinc-900">{value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Répartition par format */}
        {formatCounts.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden mb-4">
            <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
              <p className="text-xs font-semibold text-zinc-600">Répartition par format</p>
            </div>
            <div className="grid divide-x divide-zinc-100" style={{ gridTemplateColumns: `repeat(${formatCounts.length}, 1fr)` }}>
              {formatCounts.map(({ key, label, count }) => (
                <div key={key} className="px-4 py-3 text-center">
                  <p className="text-xl font-bold text-zinc-900">{count}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Derniers magasins */}
        {(magasinsRecents ?? []).length > 0 && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
              <p className="text-xs font-semibold text-zinc-600">Derniers magasins ouverts</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {(magasinsRecents as any[]).map((m) => (
                  <tr key={m.id} className="border-b border-zinc-100 last:border-0">
                    <td className="py-2 px-4">
                      <Link href={`/reseau/${m.id}`} className="font-medium text-zinc-900 hover:underline">
                        {m.nom}
                      </Link>
                      {m.ville && <span className="ml-1.5 text-zinc-400 text-xs">{m.ville}</span>}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`text-xs border rounded px-2 py-0.5 ${
                        m.type === "integre"
                          ? "text-blue-700 border-blue-200 bg-blue-50"
                          : "text-zinc-500 border-zinc-200"
                      }`}>
                        {m.type === "integre" ? "Intégré" : "Franchisé"}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-zinc-500 text-xs">
                      {m.franchises?.nom ?? (m.type === "integre" ? "Mediaclinic" : "—")}
                    </td>
                    <td className="py-2 px-4 text-zinc-400 text-xs text-right">
                      {formatDate(m.date_ouverture)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ouvertures en cours */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Ouvertures en cours</h2>
          <Link href="/projets" className="text-xs text-zinc-500 hover:text-zinc-900">Voir tous →</Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="py-2 px-4 font-medium text-zinc-600">Projet</th>
                <th className="py-2 px-4 font-medium text-zinc-600">Format</th>
                <th className="py-2 px-4 font-medium text-zinc-600">Statut</th>
                <th className="py-2 px-4 font-medium text-zinc-600">Ouverture cible</th>
              </tr>
            </thead>
            <tbody>
              {(projets ?? [])
                .filter((p) => p.statut !== "abandonne")
                .map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                    <td className="py-2 px-4">
                      <Link href={`/projets/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                        {p.nom}
                      </Link>
                    </td>
                    <td className="py-2 px-4 text-zinc-600">
                      {FORMAT_LABELS[p.format_magasin as keyof typeof FORMAT_LABELS]}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[p.statut as keyof typeof COLORS]}`}>
                        {STATUT_PROJET_LABELS[p.statut as keyof typeof STATUT_PROJET_LABELS]}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-zinc-500">
                      {formatDate(p.date_cible_ouverture)}
                    </td>
                  </tr>
                ))}
              {(projets ?? []).filter((p) => p.statut !== "abandonne").length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-zinc-400">
                    Aucun projet pour l&apos;instant.{" "}
                    <Link href="/projets/new" className="text-zinc-600 underline">Créer le premier</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
