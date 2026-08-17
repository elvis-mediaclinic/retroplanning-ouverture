import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { STATUT_CANDIDAT_LABELS } from "@/lib/types";
import { STATUT_CANDIDAT_COLORS } from "@/lib/utils";

export default async function CandidatsPage() {
  await requireMC();
  const supabase = await createClient();

  const { data: candidats } = await supabase
    .from("candidats")
    .select("id, nom, prenom, email, telephone, zone_souhaitee, statut, apport_personnel, profil_id")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Candidats franchisés</h1>
          <p className="text-sm text-zinc-500">Suivi des candidats en cours d&apos;évaluation</p>
        </div>
        <Link
          href="/candidats/new"
          className="btn-primary"
        >
          + Ajouter
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
              <th className="py-2 px-4 font-medium text-zinc-600">Nom</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Email</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Zone</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Apport</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Statut</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {(candidats ?? []).map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                <td className="py-2 px-4">
                  <div className="font-medium text-zinc-900">
                    {c.prenom} {c.nom}
                  </div>
                  {c.profil_id && (
                    <div className="text-xs text-green-600 mt-0.5">✓ Compte actif</div>
                  )}
                </td>
                <td className="py-2 px-4 text-zinc-500">{c.email}</td>
                <td className="py-2 px-4 text-zinc-500">{c.zone_souhaitee ?? "—"}</td>
                <td className="py-2 px-4 text-zinc-500">
                  {c.apport_personnel
                    ? `${c.apport_personnel.toLocaleString("fr-FR")} €`
                    : "—"}
                </td>
                <td className="py-2 px-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUT_CANDIDAT_COLORS[c.statut as keyof typeof STATUT_CANDIDAT_COLORS]
                    }`}
                  >
                    {STATUT_CANDIDAT_LABELS[c.statut as keyof typeof STATUT_CANDIDAT_LABELS]}
                  </span>
                </td>
                <td className="py-2 px-4 text-right">
                  <Link
                    href={`/candidats/${c.id}`}
                    className="text-xs text-zinc-500 hover:text-zinc-900"
                  >
                    Éditer
                  </Link>
                </td>
              </tr>
            ))}
            {(candidats ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 px-4 text-center text-zinc-400">
                  Aucun candidat pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
