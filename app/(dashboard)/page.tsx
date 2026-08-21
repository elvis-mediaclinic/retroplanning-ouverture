import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { STATUT_PROJET_LABELS, FORMAT_LABELS } from "@/lib/types";
import { STATUT_PROJET_COLORS as COLORS } from "@/lib/utils";

export default async function DashboardPage() {
  const profile = await getProfile();

  if (profile.role === "franchise") {
    redirect("/mon-projet");
  }

  const supabase = await createClient();

  const [{ data: projets }, { data: villes }, { data: candidats }] =
    await Promise.all([
      supabase
        .from("projets")
        .select(
          "id, nom, format_magasin, statut, date_cible_ouverture, franchisee_id"
        )
        .order("created_at", { ascending: false }),
      supabase.from("villes").select("id, statut").eq("statut", "en_etude"),
      supabase
        .from("candidats")
        .select("id, statut")
        .in("statut", ["prospect", "en_evaluation"]),
    ]);

  const stats = [
    {
      label: "Ouvertures en cours",
      value: (projets ?? []).filter((p) =>
        ["prospection", "en_cours"].includes(p.statut)
      ).length,
    },
    {
      label: "Magasins ouverts",
      value: (projets ?? []).filter((p) => p.statut === "ouvert").length,
    },
    {
      label: "Villes en étude",
      value: (villes ?? []).length,
    },
    {
      label: "Candidats en cours",
      value: (candidats ?? []).length,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">
          Bonjour, {profile.prenom} !
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Suivi des ouvertures Mediaclinic
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Ouvertures en cours
          </h2>
          <Link
            href="/projets"
            className="text-xs text-zinc-500 hover:text-zinc-900"
          >
            Voir tous →
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="py-2 px-4 font-medium text-zinc-600">Projet</th>
                <th className="py-2 px-4 font-medium text-zinc-600">Format</th>
                <th className="py-2 px-4 font-medium text-zinc-600">Statut</th>
                <th className="py-2 px-4 font-medium text-zinc-600">
                  Ouverture cible
                </th>
              </tr>
            </thead>
            <tbody>
              {(projets ?? [])
                .filter((p) => p.statut !== "abandonne")
                .map((p) => (
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
                    </td>
                    <td className="py-2 px-4 text-zinc-600">
                      {FORMAT_LABELS[p.format_magasin as keyof typeof FORMAT_LABELS]}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          COLORS[p.statut as keyof typeof COLORS]
                        }`}
                      >
                        {STATUT_PROJET_LABELS[p.statut as keyof typeof STATUT_PROJET_LABELS]}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-zinc-500">
                      {p.date_cible_ouverture
                        ? new Date(
                            p.date_cible_ouverture + "T00:00:00"
                          ).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              {(projets ?? []).filter((p) => p.statut !== "abandonne")
                .length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 px-4 text-center text-zinc-400"
                  >
                    Aucun projet pour l&apos;instant.{" "}
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
    </div>
  );
}
