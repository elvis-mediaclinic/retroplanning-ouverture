import Link from "next/link";
import { requireMC } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { STATUT_CANDIDAT_LABELS } from "@/lib/types";
import { STATUT_CANDIDAT_COLORS } from "@/lib/utils";
import { CandidatRow } from "./CandidatRow";
import { CopyEmail } from "./CopyEmail";

type Associe = { id: string; prenom: string; nom: string; email: string | null; telephone: string | null; ordre: number };

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
  candidat_associes: Associe[] | null;
};

function getVilles(c: Candidat) {
  const cvs = c.candidat_villes ?? [];
  const noms = cvs.map((cv) => {
    const v = cv.villes;
    return Array.isArray(v) ? v[0]?.nom : v?.nom;
  }).filter(Boolean) as string[];
  return noms.length > 0 ? noms.join(", ") : (c.zone_souhaitee ?? "—");
}

function CandidatCard({ c, showProjet }: { c: Candidat; showProjet?: boolean }) {
  const projetsActifs = (c.projets ?? []).filter((p) => ["prospection", "en_cours"].includes(p.statut));
  const associes = [...(c.candidat_associes ?? [])].sort((a, b) => a.ordre - b.ordre);
  return (
    <Link href={`/candidats/${c.id}`} className="block px-4 py-3 hover:bg-zinc-50">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-zinc-900">
          {c.prenom} {c.nom}{associes.map((a) => `, ${a.prenom} ${a.nom}`).join("")}
        </p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          STATUT_CANDIDAT_COLORS[c.statut as keyof typeof STATUT_CANDIDAT_COLORS]
        }`}>
          {STATUT_CANDIDAT_LABELS[c.statut as keyof typeof STATUT_CANDIDAT_LABELS]}
        </span>
      </div>
      {c.profil_id && <p className="text-xs text-green-600 mt-0.5">✓ Compte actif</p>}
      <p className="mt-0.5 text-xs text-zinc-500">
        <CopyEmail email={c.email} />
        {c.telephone && ` · ${c.telephone}`}
      </p>
      {associes.map((a) => (
        <p key={a.id} className="mt-0.5 text-xs text-zinc-500">
          {a.email ? <CopyEmail email={a.email} /> : "—"}
          {a.telephone && ` · ${a.telephone}`}
        </p>
      ))}
      <p className="mt-1 text-xs text-zinc-500">
        {getVilles(c)}
        {c.apport_personnel ? ` · ${c.apport_personnel.toLocaleString("fr-FR")} €` : ""}
      </p>
      {showProjet && projetsActifs.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {projetsActifs.map((p) => (
            <span key={p.id} className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              Projet en cours
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function CandidatTable({ candidats, empty, showProjet }: { candidats: Candidat[]; empty: string; showProjet?: boolean }) {
  if (candidats.length === 0) {
    return <p className="text-sm text-zinc-400 py-3">{empty}</p>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      {/* Mobile : cartes */}
      <div className="sm:hidden divide-y divide-zinc-100">
        {candidats.map((c) => <CandidatCard key={c.id} c={c} showProjet={showProjet} />)}
      </div>

      {/* Desktop : tableau */}
      <table className="hidden sm:table w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
            <th className="py-2 px-4 font-medium text-white">Nom</th>
            <th className="py-2 px-4 font-medium text-white">Email</th>
            <th className="py-2 px-4 font-medium text-white">Téléphone</th>
            <th className="py-2 px-4 font-medium text-white">Ville</th>
            <th className="py-2 px-4 font-medium text-white">Apport</th>
            {showProjet && <th className="py-2 px-4 font-medium text-white">Projet</th>}
            <th className="py-2 px-4 font-medium text-white">Statut</th>
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
    .select("id, nom, prenom, email, telephone, zone_souhaitee, statut, apport_personnel, profil_id, candidat_villes(villes(nom)), projets(id, statut), candidat_associes(id, prenom, nom, email, telephone, ordre)")
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
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Candidats franchisés</h1>
          <p className="page-header-subtitle">
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
