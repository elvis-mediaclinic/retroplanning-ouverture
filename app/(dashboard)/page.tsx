import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import {
  STATUT_PROJET_LABELS,
  FORMAT_LABELS,
  PHASE_LABELS,
  STATUT_ETAPE_LABELS,
  type FormatMagasin,
  type StatutEtape,
  type PhaseEtape,
} from "@/lib/types";
import { STATUT_PROJET_COLORS as COLORS, STATUT_ETAPE_COLORS } from "@/lib/utils";
import { FormatDonut } from "./FormatDonut";
import { getFormatColor, type FormatSegment } from "@/lib/format-colors";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function isUrgent(dateCible: string | null, statut: string) {
  if (statut === "en_retard") return true;
  if (!dateCible) return false;
  const target = new Date(dateCible + "T00:00:00");
  const limit = new Date();
  limit.setDate(limit.getDate() + 7);
  return target <= limit;
}

export default async function DashboardPage() {
  const profile = await getProfile();
  if (profile.role === "franchise") redirect("/mon-projet");

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const sevenDays = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // Queries parallèles
  const [
    { data: projets },
    { data: villes },
    { data: candidats },
    { data: allMagasins },
    { data: annonces },
    { data: etapesRaw },
  ] = await Promise.all([
    supabase
      .from("projets")
      .select("id, nom, format_magasin, statut, date_cible_ouverture")
      .order("created_at", { ascending: false }),
    supabase.from("villes").select("id").eq("statut", "en_etude"),
    supabase.from("candidats").select("id").in("statut", ["prospect", "en_evaluation"]),
    supabase.from("magasins").select("id, type, format, archive"),
    supabase.from("annonces").select("id, actif"),
    // Étapes urgentes : en retard ou échéance dans 7 jours (sans join pour éviter erreur PostgREST)
    supabase
      .from("etapes_projet")
      .select("id, nom, phase, statut, date_cible, resp_mc, projet_id")
      .in("statut", ["a_faire", "en_cours", "en_retard"])
      .or(`statut.eq.en_retard,date_cible.lte.${sevenDays}`)
      .order("date_cible", { ascending: true, nullsFirst: false }),
  ]);

  // Filtre étapes selon le rôle
  let etapes = (etapesRaw ?? []) as any[];
  if (profile.role === "responsable_mc") {
    etapes = etapes.filter(
      (e) => Array.isArray(e.resp_mc) && e.resp_mc.includes(profile.id)
    );
  }

  // Noms des projets concernés (requête séparée pour éviter join PostgREST)
  const projetIds = [...new Set(etapes.map((e) => e.projet_id).filter(Boolean))];
  const projetNoms: Record<string, string> = {};
  if (projetIds.length > 0) {
    const { data: projetRows } = await supabase
      .from("projets")
      .select("id, nom")
      .in("id", projetIds);
    (projetRows ?? []).forEach((p) => { projetNoms[p.id] = p.nom; });
  }

  // Groupement des étapes par projet
  const etapesParProjet = etapes.reduce<Record<string, { projetNom: string; etapes: typeof etapes }>>(
    (acc, e) => {
      const pid = e.projet_id;
      if (!acc[pid]) acc[pid] = { projetNom: projetNoms[pid] ?? "Projet inconnu", etapes: [] };
      acc[pid].etapes.push(e);
      return acc;
    },
    {}
  );

  // Stats réseau
  const magasinList = allMagasins ?? [];
  const actifs = magasinList.filter((m) => !m.archive);
  const archives = magasinList.filter((m) => m.archive);
  const integreCount = actifs.filter((m) => m.type === "integre").length;
  const franchiseCount = actifs.filter((m) => m.type === "franchise").length;
  const ouverturesEnCours = (projets ?? []).filter((p) => ["prospection", "en_cours"].includes(p.statut)).length;

  // Répartition par format — actifs
  const formatSegments: FormatSegment[] = Object.entries(FORMAT_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      count: actifs.filter((m) => m.format === key).length,
      color: getFormatColor(key),
    }))
    .filter((s) => s.count > 0);
  const formatTotal = formatSegments.reduce((s, f) => s + f.count, 0);

  // Répartition par format — archivés
  const formatSegmentsArchives: FormatSegment[] = Object.entries(FORMAT_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      count: archives.filter((m) => m.format === key).length,
      color: getFormatColor(key),
    }))
    .filter((s) => s.count > 0);
  const formatTotalArchives = formatSegmentsArchives.reduce((s, f) => s + f.count, 0);

  // Annonces actives
  const annoncesActives = (annonces ?? []).filter((a) => a.actif).length;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="mt-4 mb-10">
        <h1 className="text-3xl font-bold uppercase text-[#0089bd]">Suivi développement franchise</h1>
        <p className="mt-2 text-lg text-zinc-500">Bonjour {profile.prenom} !</p>
      </div>

      {/* ── Réseau ───────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Réseau</h2>
          <Link href="/reseau" className="text-xs font-medium text-[#0089bd] hover:text-[#00729e]">
            Voir le réseau →
          </Link>
        </div>

        <div className="space-y-4">
          {/* Ligne 1 — totaux pleine largeur */}
          <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-white mb-5">Magasins dans le réseau</p>
            <div className="space-y-4">
              {/* Ligne 1 — total */}
              <div className="flex items-baseline gap-3">
                <p className="text-7xl font-bold text-white">{actifs.length}</p>
                <p className="text-xl text-white/70">ouverts</p>
              </div>
              {/* Ligne 2 — détail */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-white">{integreCount}</p>
                  <p className="text-base text-white/70">intégré{integreCount > 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-white/80">{franchiseCount}</p>
                  <p className="text-base text-white/70">franchisé{franchiseCount > 1 ? "s" : ""}</p>
                </div>
                {ouverturesEnCours > 0 && (
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-amber-300">{ouverturesEnCours}</p>
                    <p className="text-base text-white/70">ouverture{ouverturesEnCours > 1 ? "s" : ""} en cours</p>
                  </div>
                )}
                {archives.length > 0 && (
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-white/40">{archives.length}</p>
                    <p className="text-base text-white/40">archivé{archives.length > 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ligne 2 — deux donuts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-white mb-4">Répartition par format — ouverts</p>
              <FormatDonut segments={formatSegments} total={formatTotal} light />
            </div>
            {formatTotalArchives > 0 && (
              <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-5 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-white mb-4">Répartition par format — archivés</p>
                <FormatDonut segments={formatSegmentsArchives} total={formatTotalArchives} light />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Développement ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Développement
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Ouvertures en cours",
              value: (projets ?? []).filter((p) =>
                ["prospection", "en_cours"].includes(p.statut)
              ).length,
              href: "/projets",
            },
            { label: "Villes en étude", value: (villes ?? []).length, href: "/villes" },
            { label: "Candidats en cours", value: (candidats ?? []).length, href: "/candidats" },
            { label: "Annonces publiées", value: annoncesActives, href: "/villes" },
          ].map(({ label, value, href }) => (
            <Link
              key={label}
              href={href}
              className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-4 shadow-sm hover:brightness-110 transition-all"
            >
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="mt-0.5 text-xs text-white/70">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Étapes à traiter ─────────────────────────────────────── */}
      {Object.keys(etapesParProjet).length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            À traiter — échéances &lt; 7 jours ou en retard
          </h2>
          <div className="space-y-3">
            {Object.entries(etapesParProjet).map(([pid, { projetNom, etapes: pe }]) => (
              <div key={pid} className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-gradient-to-br from-[#00729e] to-[#0089bd] px-4 py-2.5">
                  <Link href={`/projets/${pid}`} className="text-sm font-semibold text-white hover:underline">
                    {projetNom}
                  </Link>
                  <span className="text-xs text-white/80 font-medium">{pe.length} étape{pe.length > 1 ? "s" : ""}</span>
                </div>
                <ul className="divide-y divide-zinc-100">
                  {pe.map((e: any) => {
                    const retard = e.statut === "en_retard" || (e.date_cible != null && e.date_cible < today);
                    const aujourd = !retard && e.date_cible === today;
                    return (
                      <li key={e.id} className={`flex items-center gap-3 px-4 py-2.5 ${retard ? "bg-red-50" : ""}`}>
                        {/* Barre urgence */}
                        <span className={`w-1.5 h-6 rounded-full shrink-0 ${
                          retard ? "bg-red-500" : aujourd ? "bg-amber-400" : "bg-zinc-300"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${retard ? "text-red-900" : "text-zinc-900"}`}>
                            {e.nom}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {PHASE_LABELS[e.phase as PhaseEtape]}
                          </p>
                        </div>
                        {/* Badge date/urgence */}
                        {retard ? (
                          <span className="text-xs rounded-full px-2.5 py-0.5 font-semibold shrink-0 bg-red-100 text-red-700 ring-1 ring-red-200">
                            En retard · {e.date_cible ? formatDate(e.date_cible) : "—"}
                          </span>
                        ) : aujourd ? (
                          <span className="text-xs rounded-full px-2.5 py-0.5 font-semibold shrink-0 bg-amber-100 text-amber-700">
                            Aujourd&apos;hui
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 shrink-0">
                            {e.date_cible ? formatDate(e.date_cible) : "—"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Ouvertures en cours ──────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Ouvertures en cours</h2>
          <Link href="/projets" className="text-xs font-medium text-[#0089bd] hover:text-[#00729e]">
            Voir tous →
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
                <th className="py-2 px-4 font-medium text-white">Projet</th>
                <th className="py-2 px-4 font-medium text-white">Format</th>
                <th className="py-2 px-4 font-medium text-white">Statut</th>
                <th className="py-2 px-4 font-medium text-white">Ouverture cible</th>
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
                    <td className="py-2 px-4 text-zinc-500">{formatDate(p.date_cible_ouverture)}</td>
                  </tr>
                ))}
              {(projets ?? []).filter((p) => p.statut !== "abandonne").length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-zinc-400">
                    Aucun projet.{" "}
                    <Link href="/projets/new" className="text-zinc-600 underline">Créer le premier</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
