import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { STATUT_CANDIDAT_LABELS } from "@/lib/types";
import { STATUT_CANDIDAT_COLORS } from "@/lib/utils";

type Candidat = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  zone_souhaitee: string | null;
  statut: string;
  apport_personnel: number | null;
  profil_id: string | null;
  candidat_villes: Array<{ villes: { nom: string } | { nom: string }[] | null }> | null;
  projets: Array<{ id: string; statut: string }> | null;
};

function getVilles(c: Candidat) {
  const cvs = c.candidat_villes ?? [];
  const noms = cvs.map((cv) => {
    const v = cv.villes;
    return Array.isArray(v) ? v[0]?.nom : v?.nom;
  }).filter(Boolean) as string[];
  return noms.length > 0 ? noms.join(", ") : (c.zone_souhaitee ?? "—");
}

function CandidatRow({ c, showProjet }: { c: Candidat; showProjet?: boolean }) {
  const projetsActifs = (c.projets ?? []).filter((p) => ["prospection", "en_cours"].includes(p.statut));
  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="py-2 px-4">
        <div className="font-medium text-zinc-900">{c.prenom} {c.nom}</div>
        {c.profil_id && <div className="text-xs text-green-600 mt-0.5">✓ Compte actif</div>}
      </td>
      <td className="py-2 px-4 text-zinc-500">{c.email}</td>
      <td className="py-2 px-4 text-zinc-500">{getVilles(c)}</td>
      <td className="py-2 px-4 text-zinc-500">
        {c.apport_personnel ? `${c.apport_personnel.toLocaleString("fr-FR")} €` : "—"}
      </td>
      {showProjet && (
        <td className="py-2 px-4">
          {projetsActifs.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {projetsActifs.map((p) => (
                <Link key={p.id} href={`/projets/${p.id}`}
                  className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand/20">
                  Projet →
                </Link>
              ))}
            </div>
          ) : "—"}
        </td>
      )}
      <td className="py-2 px-4">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          STATUT_CANDIDAT_COLORS[c.statut as keyof typeof STATUT_CANDIDAT_COLORS]
        }`}>
          {STATUT_CANDIDAT_LABELS[c.statut as keyof typeof STATUT_CANDIDAT_LABELS]}
        </span>
      </td>
      <td className="py-2 px-4 text-right">
        <Link href={`/candidats/${c.id}`} className="text-xs text-zinc-500 hover:text-zinc-900">
          Éditer
        </Link>
      </td>
    </tr>
  );
}

function CandidatTable({ candidats, empty, showProjet }: { candidats: Candidat[]; empty: string; showProjet?: boolean }) {
  if (candidats.length === 0) {
    return <p className="text-sm text-zinc-400 py-3">{empty}</p>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
            <th className="py-2 px-4 font-medium text-zinc-600">Nom</th>
            <th className="py-2 px-4 font-medium text-zinc-600">Email</th>
            <th className="py-2 px-4 font-medium text-zinc-600">Zone</th>
            <th className="py-2 px-4 font-medium text-zinc-600">Apport</th>
            {showProjet && <th className="py-2 px-4 font-medium text-zinc-600">Projet</th>}
            <th className="py-2 px-4 font-medium text-zinc-600">Statut</th>
            <th className="py-2 px-4" />
          </tr>
        </thead>
        <tbody>
          {candidats.map((c) => <CandidatRow key={c.id} c={c} showProjet={showProjet} />)}
        </tbody>
      </table>
    </div>
  );
}

export default async function CandidatsPage() {
  await requireMC();
  const supabase = await createClient();

  const { data } = await supabase
    .from("candidats")
    .select("id, nom, prenom, email, telephone, zone_souhaitee, statut, apport_personnel, profil_id, candidat_villes(villes(nom)), projets(id, statut)")
    .order("created_at", { ascending: false });

  const candidats = (data ?? []) as Candidat[];

  const hasProjetActif = (c: Candidat) =>
    (c.projets ?? []).some((p) => ["prospection", "en_cours"].includes(p.statut));

  const avecProjet = candidats.filter((c) => c.statut === "valide" && hasProjetActif(c));
  const enCours    = candidats.filter((c) => ["prospect", "en_evaluation"].includes(c.statut) ||
    (c.statut === "valide" && !hasProjetActif(c)));
  const signes     = candidats.filter((c) => c.statut === "signe");
  const refuses    = candidats.filter((c) => c.statut === "refuse");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Candidats franchisés</h1>
          <p className="text-sm text-zinc-500">
            {avecProjet.length > 0 && `${avecProjet.length} projet en cours · `}
            {enCours.length} en évaluation · {signes.length} signé{signes.length !== 1 ? "s" : ""}
            {refuses.length > 0 && ` · ${refuses.length} refusé${refuses.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/candidats/new" className="btn-primary">+ Ajouter</Link>
      </div>

      {/* Signés */}
      {signes.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Signés</h2>
          <CandidatTable candidats={signes} empty="" />
        </section>
      )}

      {/* Validés avec projet en cours */}
      {avecProjet.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Validés — projet en cours</h2>
          <CandidatTable candidats={avecProjet} empty="" showProjet />
        </section>
      )}

      {/* En évaluation */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">En évaluation</h2>
        <CandidatTable candidats={enCours} empty="Aucun candidat en cours." />
      </section>

      {/* Refusés */}
      {refuses.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Refusés</h2>
          <CandidatTable candidats={refuses} empty="" />
        </section>
      )}
    </div>
  );
}
